import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function createSnehaUser() {
  // Find Ashwin N user details
  const ashwin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "ashwin.n@myfrido.com" },
        { name: { contains: "Ashwin", mode: "insensitive" } },
      ],
    },
  });

  if (!ashwin) {
    console.error("Ashwin N user not found!");
    return;
  }

  console.log("Found Ashwin N user details:", {
    id: ashwin.id,
    name: ashwin.name,
    email: ashwin.email,
    role: ashwin.role,
    teamLeadId: ashwin.teamLeadId,
    empId: ashwin.empId,
  });

  const hashedPassword = await bcrypt.hash("Sneha@2026", 10);

  const sneha = await prisma.user.upsert({
    where: { email: "sneha.m@myfrido.com" },
    update: {
      name: "Sneha M",
      password: hashedPassword,
      role: ashwin.role,
      teamLeadId: ashwin.teamLeadId,
    },
    create: {
      name: "Sneha M",
      email: "sneha.m@myfrido.com",
      password: hashedPassword,
      role: ashwin.role,
      teamLeadId: ashwin.teamLeadId,
      joiningDate: new Date(),
    },
  });

  console.log("Successfully created/updated user Sneha M:", {
    id: sneha.id,
    name: sneha.name,
    email: sneha.email,
    role: sneha.role,
    teamLeadId: sneha.teamLeadId,
  });
}

createSnehaUser()
  .catch((e) => {
    console.error("Error creating Sneha user:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
