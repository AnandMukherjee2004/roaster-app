import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamLeadId: true,
      teamLead: { select: { id: true, name: true, role: true } },
    },
    orderBy: { role: "asc" },
  });

  console.log("Total Users in DB:", users.length);
  console.table(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    teamLeadId: u.teamLeadId,
    teamLeadName: u.teamLead?.name || "None",
  })));
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
