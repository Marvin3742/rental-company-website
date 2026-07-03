// Create/update the admin login from ADMIN_EMAIL/ADMIN_PASSWORD env vars.
// Run: node --env-file=.env prisma/create-admin.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
await prisma.adminUser.upsert({
  where: { email },
  create: { email, passwordHash },
  update: { passwordHash },
});
console.log(`✓ Admin user ready: ${email}`);
await prisma.$disconnect();
