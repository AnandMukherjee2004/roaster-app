import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import HistoryFilters from "@/components/HistoryFilters";
import AuditList from "@/components/AuditList";
import { getAuditRecords } from "@/app/actions/audits";
import Link from "next/link";
import type { AgentWithTeamLead, AttendanceRecordStatus, TeamLeadSummary } from "@/types/attendance";

interface Props {
  searchParams: Promise<{ date?: string; tl?: string; view?: string }>;
}

export default async function AdminHistoryPage({ searchParams }: Props) {
  const { date, tl, view } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") redirect("/dashboard");

  const activeView = view || "attendance"; // 'attendance' or 'audits'
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
  const present = records.filter((r) => r.status === "PRESENT").length;
  const halfDay = records.filter((r) => r.status === "HALF_DAY").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 365);

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
        <div>
          <h1 className="text-lg font-bold text-gray-900">History</h1>
        </div>

        {/* FINTECH PILL VIEW TOGGLE: ATTENDANCE HISTORY vs AUDIT HISTORY */}
        <div className="inline-flex bg-[#EAE8E2] p-1.5 rounded-full border border-stone-200/60 shadow-xs">
          <Link
            href={`/admin/history?date=${selectedDate}&tl=${selectedTL}&view=attendance`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${activeView === "attendance"
              ? "bg-[#111111] text-white shadow-sm"
              : "text-stone-600 hover:text-[#111111]"
              }`}
          >
            Attendance History
          </Link>
          <Link
            href={`/admin/history?date=${selectedDate}&tl=${selectedTL}&view=audits`}
            className={`py-2 px-6 font-extrabold text-xs rounded-full transition-all ${activeView === "audits"
              ? "bg-[#E0533C] text-white shadow-sm"
              : "text-stone-600 hover:text-[#111111]"
              }`}
          >
            Audit History ({audits.length})
          </Link>
        </div>

        {activeView === "attendance" ? (
          <div className="space-y-6">
            <HistoryFilters
              selectedDate={selectedDate}
              today={today}
              minDate={formatDate(minDate)}
              selectedTL={selectedTL}
              teamLeads={teamLeads.map((t) => ({ id: t.id, name: t.name }))}
            />

            {records.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-extrabold mb-4">
                <span className="text-emerald-600 font-bold">{present} Present</span>
                <span className="text-blue-600 font-bold">{halfDay} Half Day</span>
                <span className="text-[#E0533C] font-bold">{absent} Absent</span>
              </div>
            )}

            <div className="bg-white border border-stone-200/60 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              {records.length === 0 ? (
                <p className="p-12 text-center text-xs font-semibold text-stone-400">No attendance recorded for this date.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F8F7F4] text-stone-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200/60">
                        <th className="text-left px-5 py-4">Agent</th>
                        <th className="text-left px-5 py-4">Team Lead</th>
                        <th className="text-left px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {agents.map((agent) => {
                        const status = recordMap.get(agent.id);
                        return (
                          <tr key={agent.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-black text-[#111111]">{agent.name}</p>
                              <p className="text-[10px] text-stone-400 font-normal">{agent.email}</p>
                            </td>
                            <td className="px-5 py-4 text-stone-600 font-semibold">{agent.teamLead?.name ?? "-"}</td>

                            <td className="px-5 py-4">
                              {status ? (
                                <span className={`text-[11px] px-3 py-1 rounded-full font-extrabold border ${status === "PRESENT"
                                  ? "bg-[#E8F5E9] text-[#0D5C3A] border-[#C8E6C9]/80"
                                  : status === "HALF_DAY"
                                    ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]/80"
                                    : "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]/80"
                                  }`}>
                                  {status === "PRESENT" ? "Present" : status === "HALF_DAY" ? "Half Day" : "Absent"}
                                </span>
                              ) : (
                                <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                                  Not marked
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <AuditList audits={audits} />
        )}
      </main>
    </div>
  );
}
