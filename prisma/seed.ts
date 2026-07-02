import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type AgentSeed = { name: string };

const teams: { tl: string; agents: AgentSeed[] }[] = [
  {
    tl: "Parvi D",
    agents: [
      { name: "Prerna" },
      { name: "Aditya N" },
      { name: "Asif J" },
    ],
  },
  {
    tl: "Kaif M",
    agents: [
      { name: "Deepali T" },
      { name: "Sanket" },
      { name: "Sanskar S" },
    ],
  },
  {
    tl: "Rohit B",
    agents: [
      { name: "Vansh" },
      { name: "Prasad P" },
      { name: "Vanshri" },
      { name: "Yashika" },
    ],
  },
  {
    tl: "Nikhil K",
    agents: [
      { name: "Akriti" },
      { name: "Aditya P" },
      { name: "Vedika" },
      { name: "Vimala" },
    ],
  },
  {
    tl: "Lajri P",
    agents: [
      { name: "Vivek S" },
      { name: "Vrushali" },
      { name: "Mangesh" },
      { name: "Sonali" },
    ],
  },
  {
    tl: "Sagan N",
    agents: [
      { name: "Bipasha" },
      { name: "Sitesh K" },
    ],
  },
];

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, ".");
}

async function main() {
  await prisma.attendanceRecord.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("CRAxAnand@2004", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  await prisma.user.create({
    data: { name: "Anand M", email: "anand.m@myfrido.com", password: adminPassword, role: "ADMIN" },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Ashwin N",
      email: "ashwin.n@myfrido.com",
      password: managerPassword,
      role: "MANAGER",
    },
  });

  for (const team of teams) {
    const tlSlug = slugify(team.tl);
    const tlFirstWord = team.tl.split(" ")[0];
    const tlPassword = await bcrypt.hash(`${tlFirstWord}@2026`, 10);

    const tlUser = await prisma.user.create({
      data: {
        name: team.tl,
        email: `${tlSlug}@myfrido.com`,
        password: tlPassword,
        role: "TL",
        teamLead: { connect: { id: managerUser.id } },
      },
    });

    for (const agent of team.agents) {
      const agentSlug = slugify(agent.name);
      const email = `${agentSlug}@myfrido.com`;

      await prisma.user.create({
        data: {
          name: agent.name,
          email,
          password: agentPassword,
          role: "TL",
          teamLead: { connect: { id: tlUser.id } },
        },
      });
    }
  }

  console.log("\n✅ Seed complete!\n");
  console.log("  Admin:    anand.m@myfrido.com  /  CRAxAnand@2004");
  console.log("  Manager:  ashwin.n@myfrido.com /  manager123");
  for (const team of teams) {
    const tlFirstWord = team.tl.split(" ")[0];
    console.log(`  TL:       ${slugify(team.tl)}@myfrido.com  /  ${tlFirstWord}@2026`);
  }
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
