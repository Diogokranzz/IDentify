import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import argon2 from "argon2";
import dotenv from "dotenv";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "crypto";

dotenv.config();

const prisma = new PrismaClient();
const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
    },
  },
  trustProxy: true,
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const isProd = process.env.NODE_ENV === "production";
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : true;

await app.register(cors, { origin: corsOrigin, credentials: true });
await app.register(helmet);
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
if (!isProd) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "IDentify API",
        version: "1.0.0",
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
}
await app.register(jwt, { secret: jwtSecret });

app.setErrorHandler((error, request, reply) => {
  app.log.error({ err: error }, "request failed");

  if (error instanceof z.ZodError) {
    return reply.code(400).send({
      error: "Dados inválidos",
      details: error.flatten(),
    });
  }

  if ((error as { code?: string }).code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
    return reply.code(415).send({ error: "Tipo de mídia não suportado" });
  }

  if ((error as { code?: string }).code === "P2002") {
    return reply.code(409).send({ error: "Registro duplicado" });
  }

  return reply.code(500).send({ error: "Erro interno do servidor" });
});

app.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Não autorizado" });
  }
});

const jwksUrl = process.env.SSO_JWKS_URL;
const ssoIssuer = process.env.SSO_ISSUER;
const ssoAudience = process.env.SSO_AUDIENCE;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
const matchThreshold = Number(process.env.FACE_MATCH_THRESHOLD || "0.82");
const terminalKey = process.env.TERMINAL_KEY || "";

async function verifySsoToken(idToken: string) {
  if (!jwks || !ssoIssuer || !ssoAudience) {
    throw new Error("SSO não configurado");
  }
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: ssoIssuer,
    audience: ssoAudience,
  });
  const email = String(payload.email || payload.preferred_username || "");
  if (!email) {
    throw new Error("Token SSO sem e-mail");
  }
  return { email };
}

async function audit(
  adminId: string,
  action: string,
  request: FastifyRequest,
  options?: { status?: number; meta?: Record<string, unknown> }
) {
  const route = request.routeOptions?.url || request.url;
  const userAgent = request.headers["user-agent"];
  await prisma.adminAudit.create({
    data: {
      adminId,
      action,
      ip: request.ip,
      method: request.method,
      route,
      userAgent: typeof userAgent === "string" ? userAgent : undefined,
      status: options?.status,
      meta: options?.meta,
    },
  });
}

function toVectorString(values: number[]) {
  const sanitized = values.map((value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new Error("Valor inválido no descritor");
    }
    return num.toFixed(6);
  });
  return `[${sanitized.join(",")}]`;
}

app.get("/health", async () => ({ status: "ok" }));

app.post("/auth/login", async (request, reply) => {
  const totpSchema = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().length(6)
  );
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    totp: totpSchema.optional(),
  });
  const { email, password, totp } = schema.parse(request.body);

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || admin.status !== "active") {
    return reply.code(401).send({ error: "Credenciais inválidas" });
  }

  const ok = await argon2.verify(admin.passwordHash, password);
  if (!ok) {
    return reply.code(401).send({ error: "Credenciais inválidas" });
  }

  if (admin.totpEnabled) {
    if (!totp || !admin.totpSecret) {
      return reply.code(401).send({ error: "TOTP obrigatório" });
    }
    const validTotp = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: "base32",
      token: totp,
      window: 1,
    });
    if (!validTotp) {
      return reply.code(401).send({ error: "TOTP inválido" });
    }
  }

  const token = app.jwt.sign({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  await audit(admin.id, "login", request, { status: 200 });
  return reply.send({ token });
});

app.post("/auth/sso", async (request, reply) => {
  const schema = z.object({ idToken: z.string().min(10) });
  const { idToken } = schema.parse(request.body);

  try {
    const { email } = await verifySsoToken(idToken);
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return reply.code(401).send({ error: "Administrador não encontrado" });
    }

    const token = app.jwt.sign({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });
    await audit(admin.id, "sso-login", request, { status: 200 });
    return reply.send({ token });
  } catch (error) {
    return reply.code(401).send({ error: "Falha na verificação do SSO" });
  }
});

app.post("/auth/2fa/setup", { preHandler: [app.authenticate] }, async (request, reply) => {
  const adminId = request.user.adminId;
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    return reply.code(404).send({ error: "Administrador não encontrado" });
  }

  const secret = speakeasy.generateSecret({ name: `IDentify:${admin.email}` });
  const qr = secret.otpauth_url ? await qrcode.toDataURL(secret.otpauth_url) : "";

  await prisma.admin.update({
    where: { id: adminId },
    data: { totpSecret: secret.base32, totpEnabled: false },
  });

  await audit(adminId, "2fa-setup", request, { status: 200 });
  return reply.send({ otpauth: secret.otpauth_url, qr });
});

app.post("/auth/2fa/verify", { preHandler: [app.authenticate] }, async (request, reply) => {
  const schema = z.object({ totp: z.string().length(6) });
  const { totp } = schema.parse(request.body);
  const adminId = request.user.adminId;

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin || !admin.totpSecret) {
    return reply.code(400).send({ error: "2FA não configurado" });
  }

  const valid = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: totp,
    window: 1,
  });

  if (!valid) {
    return reply.code(400).send({ error: "TOTP inválido" });
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { totpEnabled: true },
  });

  await audit(adminId, "2fa-verify", request, { status: 200 });
  return reply.send({ enabled: true });
});

app.get("/admin/me", { preHandler: [app.authenticate] }, async (request) => {
  const adminId = request.user.adminId;
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, name: true, role: true, status: true, totpEnabled: true },
  });
  return { admin };
});

app.get("/admin/audit", { preHandler: [app.authenticate] }, async (request) => {
  const querySchema = z.object({
    limit: z.coerce.number().min(1).max(200).default(50),
  });
  const { limit } = querySchema.parse(request.query);

  const logs = await prisma.adminAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: {
        select: { email: true, name: true },
      },
    },
  });

  return {
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      ip: log.ip,
      method: log.method,
      route: log.route,
      userAgent: log.userAgent,
      status: log.status,
      meta: log.meta,
      createdAt: log.createdAt,
      admin: log.admin,
    })),
  };
});

app.post("/faces/verify", async (request, reply) => {
  if (terminalKey) {
    const headerKey = request.headers["x-terminal-key"];
    if (!headerKey || headerKey !== terminalKey) {
      return reply.code(401).send({ error: "Terminal não autorizado" });
    }
  }

  const schema = z.object({
    descriptor: z.array(z.number()).length(128),
  });
  const { descriptor } = schema.parse(request.body);
  const vector = toVectorString(descriptor);

  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string; block: string; area: string; status: string; score: number }[]
  >(
    `SELECT p."id", p."name", p."block", p."area", p."status",
      1 - (f."embedding" <=> '${vector}'::vector) AS score
     FROM "FaceEmbedding" f
     JOIN "Person" p ON p."id" = f."personId"
     ORDER BY f."embedding" <=> '${vector}'::vector
     LIMIT 1;`
  );

  if (!rows.length) {
    return reply.send({ matched: false, reason: "Nenhuma correspondência facial" });
  }

  const best = rows[0];
  const allowed = best.score >= matchThreshold && best.status === "active";

  return reply.send({
    matched: allowed,
    score: Number(best.score.toFixed(4)),
    person: {
      id: best.id,
      name: best.name,
      block: best.block,
      area: best.area,
      status: best.status,
    },
  });
});

app.post("/faces/enroll", { preHandler: [app.authenticate] }, async (request, reply) => {
  const schema = z.object({
    personId: z.string().min(1),
    descriptor: z.array(z.number()).length(128),
  });
  const { personId, descriptor } = schema.parse(request.body);

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    return reply.code(404).send({ error: "Pessoa não encontrada" });
  }

  const vector = toVectorString(descriptor);
  const embeddingId = randomUUID();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "FaceEmbedding" ("id","personId","embedding") VALUES ('${embeddingId}', '${personId}', '${vector}'::vector);`
  );

  await audit(request.user.adminId, "face-enroll", request, {
    status: 201,
    meta: { personId, embeddingId },
  });

  return reply.code(201).send({ id: embeddingId });
});

app.get("/persons", { preHandler: [app.authenticate] }, async () => {
  const persons = await prisma.person.findMany({ orderBy: { createdAt: "desc" } });
  return { data: persons };
});

app.post("/persons", { preHandler: [app.authenticate] }, async (request, reply) => {
  const schema = z.object({
    name: z.string().min(2),
    block: z.string().min(1),
    area: z.string().min(1),
    status: z.enum(["active", "blocked"]).optional(),
    photoUrl: z.string().url().optional(),
  });
  const payload = schema.parse(request.body);
  const created = await prisma.person.create({ data: payload });
  await audit(request.user.adminId, "person-create", request, {
    status: 201,
    meta: { personId: created.id },
  });
  return reply.code(201).send({ data: created });
});

app.patch("/persons/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    block: z.string().min(1).optional(),
    area: z.string().min(1).optional(),
    status: z.enum(["active", "blocked"]).optional(),
    photoUrl: z.string().url().nullable().optional(),
  });
  const payload = schema.parse(request.body);
  const { id } = request.params as { id: string };

  const updated = await prisma.person.update({ where: { id }, data: payload });
  await audit(request.user.adminId, "person-update", request, {
    status: 200,
    meta: { personId: id },
  });
  return reply.send({ data: updated });
});

app.delete("/persons/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  await prisma.person.delete({ where: { id } });
  await audit(request.user.adminId, "person-delete", request, {
    status: 204,
    meta: { personId: id },
  });
  return reply.code(204).send();
});

const port = Number(process.env.PORT || 4000);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
