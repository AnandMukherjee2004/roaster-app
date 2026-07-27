"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AUDIT_STEPS, TOTAL_MAX_SCORE, getAuditRating } from "@/lib/auditConfig";

export interface CreateAuditInput {
  agentId: string;
  customerName: string;
  leadId?: string;
  callDate: string; // YYYY-MM-DD
  callDuration?: string;
  scores: Record<string, { score: number; remark?: string }>;
}

export async function createAuditRecord(input: CreateAuditInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!input.agentId || !input.customerName || !input.callDate) {
    return { error: "Agent name, customer name, and call date are required." };
  }

  // Calculate step subtotals and overall score
  let calculatedTotalScore = 0;
  const stepSubtotals: Record<string, { name: string; maxScore: number; scoreGiven: number; percentage: number }> = {};

  for (const step of AUDIT_STEPS) {
    let stepScoreGiven = 0;
    for (const param of step.parameters) {
      const itemScore = input.scores[param.id]?.score ?? 0;
      stepScoreGiven += Number(itemScore);
    }

    const stepPercentage = step.maxScore > 0 ? (stepScoreGiven / step.maxScore) * 100 : 0;
    stepSubtotals[step.name] = {
      name: step.name,
      maxScore: step.maxScore,
      scoreGiven: stepScoreGiven,
      percentage: Number(stepPercentage.toFixed(2)),
    };

    calculatedTotalScore += stepScoreGiven;
  }

  const percentage = Number(((calculatedTotalScore / TOTAL_MAX_SCORE) * 100).toFixed(2));
  const ratingInfo = getAuditRating(percentage);

  try {
    const auditRecord = await prisma.auditRecord.create({
      data: {
        agentId: input.agentId,
        auditorId: session.user.id,
        customerName: input.customerName,
        leadId: input.leadId || null,
        callDate: new Date(input.callDate + "T00:00:00.000Z"),
        callDuration: input.callDuration || null,
        scores: input.scores,
        stepSubtotals: stepSubtotals,
        totalScore: calculatedTotalScore,
        percentage: percentage,
        rating: ratingInfo.rating,
      },
    });

    revalidatePath("/audits");
    return { success: true, auditId: auditRecord.id };
  } catch (error) {
    console.error("Error creating audit record:", error);
    return { error: "Failed to submit audit record." };
  }
}

export async function getAuditRecords() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const records = await prisma.auditRecord.findMany({
      include: {
        agent: { select: { id: true, name: true, empId: true, email: true } },
        auditor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return records;
  } catch (error) {
    console.error("Failed to fetch audit records:", error);
    return [];
  }
}

export async function getAuditById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const audit = await prisma.auditRecord.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, empId: true, email: true } },
        auditor: { select: { id: true, name: true, email: true } },
      },
    });
    return audit;
  } catch (error) {
    console.error("Failed to fetch audit by id:", error);
    return null;
  }
}

export async function getAgentsList() {
  try {
    const agents = await prisma.user.findMany({
      select: { id: true, name: true, empId: true, role: true },
      orderBy: { name: "asc" },
    });
    return agents;
  } catch (error) {
    console.error("Failed to fetch agents list:", error);
    return [];
  }
}
