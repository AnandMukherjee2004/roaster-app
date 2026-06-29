"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@/types/attendance";

export interface AgentAttendanceInput {
  agentId: string;
  status: AttendanceStatus;
}

export async function submitAttendance(
  date: string,
  records: AgentAttendanceInput[]
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TL") {
    return { error: "Unauthorized" };
  }

  const tlId = session.user.id;

  const agents = await prisma.user.findMany({
    where: { teamLeadId: tlId },
    select: { id: true },
  });
  const agentIds = new Set(agents.map((a: { id: string }) => a.id));

  for (const record of records) {
    if (!agentIds.has(record.agentId)) {
      return { error: "Unauthorized agent" };
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
            markedById: tlId,
          },
          create: {
            agentId: record.agentId,
            markedById: tlId,
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
