import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function updatePassword() {
  const newHashedPassword = await bcrypt.hash("Ashwin@2026", 10);

  const updated = await prisma.user.updateMany({
    where: { email: "ashwin.n@myfrido.com" },
    data: { password: newHashedPassword },
  });

  console.log(`Successfully updated password for ${updated.count} user(s) (ashwin.n@myfrido.com).`);
}

updatePassword()
  .catch((e) => {
    console.error("Error updating password:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
