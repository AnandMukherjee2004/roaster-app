import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import AdminTable from "@/components/AdminTable";
import AuditList from "@/components/AuditList";
import { getAuditRecords } from "@/app/actions/audits";
import Link from "next/link";
import type { AgentWithTeamLead, AttendanceRecordStatus, TeamLeadSummary } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tl?: string; section?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { date, tl, section } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") redirect("/dashboard");

  const activeSection = section || "attendance"; // 'attendance' or 'audits'
  const today = formatDate(new Date());
  const selectedDate = date || today;
  const selectedTL = tl || "";
  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const teamLeads: TeamLeadSummary[] = await prisma.user.findMany({
    where: {
      role: "TL",
      OR: [
        { teamLeadId: null },
        { teamLead: { role: "MANAGER" } }
      ]
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const agents: AgentWithTeamLead[] = await prisma.user.findMany({
    where: selectedTL
      ? { teamLeadId: selectedTL }
      : { teamLead: { role: "TL" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      joiningDate: true,
      empId: true,
      teamLeadId: true,
      teamLead: { select: { id: true, name: true } },
    },
  });

  const records: AttendanceRecordStatus[] = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: agents.map((a) => a.id) },
      date: targetDate,
    },
  });

  const recordMap = new Map(records.map((r) => [r.agentId, r.status]));

  const agentsWithStatus = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    teamLeadName: agent.teamLead?.name ?? "-",
    teamLeadId: agent.teamLeadId ?? "",
    status: recordMap.get(agent.id) ?? null,
    joiningDate: agent.joiningDate?.toISOString() ?? null,
    empId: agent.empId ?? null,
  }));

  const present = records.filter((r) => r.status === "PRESENT").length;
  const halfDay = records.filter((r) => r.status === "HALF_DAY").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const notMarked = agents.length - records.length;

  // Fetch audits for Agent Audit Overview Report
  const rawAudits = await getAuditRecords();
  const audits = rawAudits.map((record) => ({
    ...record,
    callDate: record.callDate.toISOString(),
    createdAt: record.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Navbar userName={session.user.name} role={session.user.role as any} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {activeSection === "attendance" ? "Attendance Overview" : "Agent Audit Overview Report"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeSection === "attendance"
              ? "View and manage attendance records across all teams"
              : "Quality control and evaluation metrics across agent call audits"}
          </p>
        </div>

        {/* SECTION TOGGLE PILLS */}
        <div className="inline-flex bg-[#EAE8E2] p-1.5 rounded-full border border-stone-200/60 shadow-xs">
          <Link
            href={`/admin?date=${selectedDate}&tl=${selectedTL}&section=attendance`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${
              activeSection === "attendance"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-stone-600 hover:text-[#111111]"
            }`}
          >
            Attendance Overview
          </Link>
          <Link
            href={`/admin?date=${selectedDate}&tl=${selectedTL}&section=audits`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${
              activeSection === "audits"
                ? "bg-[#E0533C] text-white shadow-sm"
                : "text-stone-600 hover:text-[#111111]"
            }`}
          >
            Agent Audit Overview Report ({audits.length})
          </Link>
        </div>

        {activeSection === "attendance" ? (
          <div className="space-y-4">
            {/* Attendance Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total Agents", value: agents.length, color: "text-[#111111]" },
                { label: "Present", value: present, color: "text-emerald-600" },
                { label: "Half Day", value: halfDay, color: "text-blue-600" },
                { label: "Absent", value: absent, color: "text-[#E0533C]" },
                { label: "Not Marked", value: notMarked, color: "text-amber-600" },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-2xs">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{card.label}</p>
                  <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <AdminTable
              agents={agentsWithStatus}
              teamLeads={teamLeads.map((tl) => ({ id: tl.id, name: tl.name }))}
              selectedDate={selectedDate}
              today={today}
              selectedTL={selectedTL}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <AuditList audits={audits} />
          </div>
        )}
      </main>
    </div>
  );
}

