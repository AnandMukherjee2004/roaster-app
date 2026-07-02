import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import AttendanceForm from "@/components/AttendanceForm";
import Link from "next/link";
import type { AgentSummary, AttendanceRecordStatus } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tab?: string; tl?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { date, tab, tl } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isManager = session.user.role === "MANAGER";
  const activeTab = tab || "tls";

  const today = formatDate(new Date());
  const selectedDate = date || today;

  const isReadOnly = !isAdmin && selectedDate !== today;

  let minDateStr = today;
  if (isAdmin) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    minDateStr = formatDate(minDate);
  }

  let tls: AgentSummary[] = [];
  let agents: AgentSummary[] = [];
  let teamLeads: { id: string; name: string }[] = [];
  let selectedTLId = tl || "";

  if (isAdmin) {
    teamLeads = await prisma.user.findMany({
      where: {
        role: "TL",
        OR: [
          { teamLeadId: null },
          { teamLead: { role: "MANAGER" } }
        ]
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });

    if (!selectedTLId && teamLeads.length > 0) {
      selectedTLId = teamLeads[0].id;
    }

    agents = await prisma.user.findMany({
      where: { teamLeadId: selectedTLId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  } else if (isManager) {
    tls = await prisma.user.findMany({
      where: { teamLeadId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    agents = await prisma.user.findMany({
      where: { teamLead: { teamLeadId: session.user.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  } else {
    agents = await prisma.user.findMany({
      where: { teamLeadId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  }

  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const allUserIds = isAdmin
    ? agents.map((a) => a.id)
    : isManager
    ? [...tls.map((t) => t.id), ...agents.map((a) => a.id)]
    : agents.map((a) => a.id);

  const existingRecords: AttendanceRecordStatus[] = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: allUserIds },
      date: targetDate,
    },
  });

  const recordMap = new Map(existingRecords.map((r) => [r.agentId, r.status]));

  const tlsWithStatus = tls.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    status: recordMap.get(agent.id) ?? null,
  }));

  const agentsWithStatus = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    status: recordMap.get(agent.id) ?? null,
  }));

  const alreadySubmittedTLs = tls.length > 0 && tls.every((t) => recordMap.has(t.id));
  const alreadySubmittedAgents = agents.length > 0 && agents.every((a) => recordMap.has(a.id));

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar userName={session.user.name} role={session.user.role as any} />
      <main className="flex-1 min-h-0 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-xl font-semibold text-gray-900">
            {isAdmin ? "Admin: Mark Attendance" : "Mark Attendance"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? `Select a Team Lead to mark their agents' attendance`
              : isManager
              ? `${tls.length} Team Lead${tls.length !== 1 ? "s" : ""} and ${agents.length} Agent${agents.length !== 1 ? "s" : ""} reporting to you`
              : `${agents.length} agent${agents.length !== 1 ? "s" : ""} under your team`}
          </p>
        </div>

        {isManager && (
          <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
            <Link
              href={`/dashboard?date=${selectedDate}&tab=tls`}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition ${
                activeTab === "tls"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Team Leads ({tls.length})
            </Link>
            <Link
              href={`/dashboard?date=${selectedDate}&tab=agents`}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition ${
                activeTab === "agents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Agents ({agents.length})
            </Link>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          {isAdmin ? (
            <AttendanceForm
              key={`admin-form-${selectedTLId}`}
              agents={agentsWithStatus}
              selectedDate={selectedDate}
              today={today}
              minDate={minDateStr}
              alreadySubmitted={alreadySubmittedAgents}
              tlId={selectedTLId}
              isReadOnly={isReadOnly}
              teamLeads={teamLeads}
              selectedTLId={selectedTLId}
            />
          ) : isManager ? (
            activeTab === "tls" ? (
              <AttendanceForm
                key="tls-form"
                agents={tlsWithStatus}
                selectedDate={selectedDate}
                today={today}
                minDate={minDateStr}
                alreadySubmitted={alreadySubmittedTLs}
                tlId={session.user.id}
                isReadOnly={isReadOnly}
              />
            ) : (
              <AttendanceForm
                key="agents-form"
                agents={agentsWithStatus}
                selectedDate={selectedDate}
                today={today}
                minDate={minDateStr}
                alreadySubmitted={alreadySubmittedAgents}
                tlId={session.user.id}
                isReadOnly={isReadOnly}
              />
            )
          ) : (
            <AttendanceForm
              agents={agentsWithStatus}
              selectedDate={selectedDate}
              today={today}
              minDate={minDateStr}
              alreadySubmitted={alreadySubmittedAgents}
              tlId={session.user.id}
              isReadOnly={isReadOnly}
            />
          )}
        </div>
      </main>
    </div>
  );
}
