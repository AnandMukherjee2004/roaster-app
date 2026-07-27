import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import AdminTable from "@/components/AdminTable";
import type { AgentWithTeamLead, AttendanceRecordStatus, TeamLeadSummary } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tl?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { date, tl } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") redirect("/dashboard");

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

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Navbar userName={session.user.name} role={session.user.role as any} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">View attendance across all teams</p>
        </div>

        {/* Summary cards */}
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
      </main>
    </div>
  );
}
