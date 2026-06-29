import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.attendanceRecord.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("CRAxAnand@2004", 10);
  const tlPassword = await bcrypt.hash("tl123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  const tl1 = await prisma.user.create({
    data: { name: "Team Lead 1", email: "tl1@company.com", password: tlPassword, role: "TL" },
  });

  const tl2 = await prisma.user.create({
    data: { name: "Team Lead 2", email: "tl2@company.com", password: tlPassword, role: "TL" },
  });

  await prisma.user.create({
    data: { name: "Anand M", email: "anand.m@myfrido.com", password: adminPassword, role: "ADMIN" },
  });

  const tl1Agents = ["Alice Johnson", "Bob Smith", "Carol White", "David Brown"];
  const tl2Agents = ["Eve Davis", "Frank Miller", "Grace Wilson", "Henry Moore"];

  for (const name of tl1Agents) {
    await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
        password: agentPassword,
        role: "TL",
        teamLeadId: tl1.id,
      },
    });
  }

  for (const name of tl2Agents) {
    await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
        password: agentPassword,
        role: "TL",
        teamLeadId: tl2.id,
      },
    });
  }

  console.log("\n✅ Seed complete!\n");
  console.log("  Admin:  anand.m@myfrido.com  /  CRAxAnand@2004");
  console.log("  TL 1:   tl1@company.com    /  tl123");
  console.log("  TL 2:   tl2@company.com    /  tl123\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
