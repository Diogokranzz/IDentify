import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD");
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed admin already exists");
    return;
  }

  const passwordHash = await argon2.hash(password);
  await prisma.admin.create({
    data: {
      email,
      name: "Admin Root",
      passwordHash,
      role: "superadmin",
      status: "active",
    },
  });

  console.log("Seed admin created:", email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
