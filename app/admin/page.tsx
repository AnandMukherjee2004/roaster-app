import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import AdminTable from "@/components/AdminTable";

interface Props {
  searchParams: Promise<{ date?: string; tl?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { date, tl } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const today = formatDate(new Date());
  const selectedDate = date || today;
  const selectedTL = tl || "";
  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const teamLeads = await prisma.user.findMany({
    where: {
      role: "TL",
      teamLeadId: null,
    },
    orderBy: { name: "asc" },
    include: { agents: true },
  });

  const agents = await prisma.user.findMany({
    where: selectedTL
      ? { teamLeadId: selectedTL }
      : { teamLeadId: { not: null } },
    orderBy: { name: "asc" },
    include: { teamLead: true },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: agents.map((a: { id: string }) => a.id) },
      date: targetDate,
    },
  });

  const recordMap = new Map(records.map((r) => [r.agentId, r.status]));

  const agentsWithStatus = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    teamLeadName: agent.teamLead?.name ?? "—",
    teamLeadId: agent.teamLeadId ?? "",
    status: recordMap.get(agent.id) ?? null,
  }));

  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const notMarked = agents.length - records.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} role="ADMIN" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">View attendance across all teams</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Agents", value: agents.length, color: "text-gray-900" },
            { label: "Present", value: present, color: "text-green-600" },
            { label: "Absent", value: absent, color: "text-red-500" },
            { label: "Not Marked", value: notMarked, color: "text-amber-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
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
