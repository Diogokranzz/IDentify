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

  const passwordHash = await argon2.hash(password);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      passwordHash,
      status: "active",
    },
    create: {
      email,
      name: "Admin Root",
      passwordHash,
      role: "superadmin",
      status: "active",
    },
  });

  console.log("Seed admin upserted:", admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
