import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import DatePicker from "@/components/DatePicker";
import Link from "next/link";
import HistoryList from "@/components/HistoryList";
import AuditList from "@/components/AuditList";
import { getAuditRecords } from "@/app/actions/audits";
import type { AgentSummary, AttendanceRecordStatus } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tab?: string; view?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const { date, tab, view } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/history");

  const isManager = session.user.role === "MANAGER";
  const activeTab = tab || "tls";
  const activeView = view || "attendance"; // 'attendance' or 'audits'

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

  // Fetch audits for Audit History view
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">History</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Switch between Attendance History and Sales Agent Audit History
            </p>
          </div>
          <Link
            href={`/dashboard?date=${selectedDate}&tab=${activeTab}`}
            className="text-xs font-extrabold text-[#E0533C] hover:underline"
          >
            ← Back to Today
          </Link>
        </div>

        {/* FINTECH PILL VIEW TOGGLE: ATTENDANCE HISTORY vs AUDIT HISTORY */}
        <div className="inline-flex bg-[#EAE8E2] p-1.5 rounded-full border border-stone-200/60 shadow-xs">
          <Link
            href={`/history?date=${selectedDate}&tab=${activeTab}&view=attendance`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${
              activeView === "attendance"
                ? "bg-[#111111] text-white shadow-sm"
                : "text-stone-600 hover:text-[#111111]"
            }`}
          >
            Attendance History
          </Link>
          <Link
            href={`/history?date=${selectedDate}&tab=${activeTab}&view=audits`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${
              activeView === "audits"
                ? "bg-[#E0533C] text-white shadow-sm"
                : "text-stone-600 hover:text-[#111111]"
            }`}
          >
            Audit History ({audits.length})
          </Link>
        </div>

        {activeView === "attendance" ? (
          <div className="space-y-6">
            {isManager && (
              <div className="flex border-b border-stone-200">
                <Link
                  href={`/history?date=${selectedDate}&tab=tls&view=attendance`}
                  className={`py-2 px-4 border-b-2 font-extrabold text-xs transition ${
                    activeTab === "tls"
                      ? "border-[#111111] text-[#111111]"
                      : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Team Leads ({tls.length})
                </Link>
                <Link
                  href={`/history?date=${selectedDate}&tab=agents&view=attendance`}
                  className={`py-2 px-4 border-b-2 font-extrabold text-xs transition ${
                    activeTab === "agents"
                      ? "border-[#111111] text-[#111111]"
                      : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}
                >
                  All Agents ({agents.length})
                </Link>
              </div>
            )}

            <div className="bg-white border border-stone-200/60 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <DatePicker selectedDate={selectedDate} today={today} minDate={formatDate(minDate)} />
              {activeRecords.length > 0 && (
                <div className="flex items-center gap-4 text-xs font-extrabold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    {present} Present
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {halfDay} Half Day
                  </span>
                  <span className="flex items-center gap-1.5 text-[#E0533C]">
                    <span className="w-2 h-2 bg-[#E0533C] rounded-full"></span>
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
          </div>
        ) : (
          <AuditList audits={audits} />
        )}
      </main>
    </div>
  );
}
