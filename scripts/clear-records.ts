import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function clearData() {
  const attendanceDeleted = await prisma.attendanceRecord.deleteMany();
  const auditsDeleted = await prisma.auditRecord.deleteMany();

  console.log(`Successfully deleted ${attendanceDeleted.count} attendance records.`);
  console.log(`Successfully deleted ${auditsDeleted.count} audit records.`);
}

clearData()
  .catch((e) => {
    console.error("Error clearing records:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
