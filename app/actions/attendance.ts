"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/utils";
import type { AgentSummary, AttendanceStatus } from "@/types/attendance";

export interface AgentAttendanceInput {
  agentId: string;
  status: AttendanceStatus;
}

export async function submitAttendance(
  date: string,
  records: AgentAttendanceInput[]
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "TL" && session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const todayStr = formatDate(new Date());
  if (date !== todayStr && session.user.role !== "ADMIN") {
    return { error: "Only admins can mark or update attendance for previous days." };
  }

  const userId = session.user.id;

  if (session.user.role !== "ADMIN") {
    let allowedAgentIds: Set<string>;

    if (session.user.role === "MANAGER") {
      const directAndIndirect = await prisma.user.findMany({
        where: {
          OR: [
            { teamLeadId: userId },
            { teamLead: { teamLeadId: userId } },
          ],
        },
        select: { id: true },
      });
      allowedAgentIds = new Set(directAndIndirect.map((u) => u.id));
    } else {
      const agents = await prisma.user.findMany({
        where: { teamLeadId: userId },
        select: { id: true },
      });
      allowedAgentIds = new Set(agents.map((a) => a.id));
    }

    for (const record of records) {
      if (!allowedAgentIds.has(record.agentId)) {
        return { error: "Unauthorized agent" };
      }
    }
  }

  const targetDate = new Date(date + "T00:00:00.000Z");

  try {
    await prisma.$transaction(
      records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            agentId_date: {
              agentId: record.agentId,
              date: targetDate,
            },
          },
          update: {
            status: record.status,
            markedById: userId,
          },
          create: {
            agentId: record.agentId,
            markedById: userId,
            date: targetDate,
            status: record.status,
          },
        })
      )
    );

    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    return { error: "Failed to save attendance" };
  }
}
