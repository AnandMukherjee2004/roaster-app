import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import DatePicker from "@/components/DatePicker";
import Link from "next/link";
import HistoryList from "@/components/HistoryList";
import type { AgentSummary, AttendanceRecordStatus } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tab?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const { date, tab } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/history");

  const isManager = session.user.role === "MANAGER";
  const activeTab = tab || "tls";

  const today = formatDate(new Date());
  const selectedDate = date || today;
  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  let tls: AgentSummary[] = [];
  let agents: AgentSummary[] = [];

  if (isManager) {
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

  const allUserIds = isManager
    ? [...tls.map((t) => t.id), ...agents.map((a) => a.id)]
    : agents.map((a) => a.id);

  const records: AttendanceRecordStatus[] = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: allUserIds },
      date: targetDate,
    },
  });

  const activeUsers = isManager
    ? (activeTab === "tls" ? tls : agents)
    : agents;

  const activeUserIds = new Set(activeUsers.map((u) => u.id));
  const activeRecords = records.filter((r) => activeUserIds.has(r.agentId));

  const present = activeRecords.filter((r) => r.status === "PRESENT").length;
  const halfDay = activeRecords.filter((r) => r.status === "HALF_DAY").length;
  const absent = activeRecords.filter((r) => r.status === "ABSENT").length;

  const recordMapData: Record<string, any> = {};
  records.forEach((r) => {
    recordMapData[r.agentId] = r.status;
  });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} role={session.user.role as any} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Attendance History</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isManager
                ? `${tls.length} Team Lead${tls.length !== 1 ? "s" : ""} and ${agents.length} Agent${agents.length !== 1 ? "s" : ""} reporting to you`
                : "View past attendance records"}
            </p>
          </div>
          <Link
            href={`/dashboard?date=${selectedDate}&tab=${activeTab}`}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Today
          </Link>
        </div>

        {isManager && (
          <div className="flex border-b border-gray-200 mb-6">
            <Link
              href={`/history?date=${selectedDate}&tab=tls`}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition ${
                activeTab === "tls"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Team Leads ({tls.length})
            </Link>
            <Link
              href={`/history?date=${selectedDate}&tab=agents`}
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

        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
          <DatePicker selectedDate={selectedDate} today={today} minDate={formatDate(minDate)} />
          {activeRecords.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {present} Present
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {halfDay} Half Day
              </span>
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {absent} Absent
              </span>
            </div>
          )}
        </div>

        <HistoryList
          agents={activeUsers}
          recordMapData={recordMapData}
          selectedDate={selectedDate}
          activeTab={activeTab}
        />
      </main>
    </div>
  );
}
