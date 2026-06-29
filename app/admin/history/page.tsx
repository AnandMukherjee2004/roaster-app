import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import HistoryFilters from "@/components/HistoryFilters";

interface Props {
  searchParams: Promise<{ date?: string; tl?: string }>;
}

export default async function AdminHistoryPage({ searchParams }: Props) {
  const { date, tl } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const today = formatDate(new Date());
  const selectedDate = date || today;
  const selectedTL = tl || "";
  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const teamLeads = await prisma.user.findMany({
    where: { role: "TL", teamLeadId: null },
    orderBy: { name: "asc" },
  });

  const agentFilter: any = { teamLeadId: { not: null } };
  if (selectedTL) agentFilter.teamLeadId = selectedTL;

  const agents = await prisma.user.findMany({
    where: agentFilter,
    orderBy: { name: "asc" },
    include: { teamLead: true },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: agents.map((a) => a.id) },
      date: targetDate,
    },
  });

  const recordMap = new Map(records.map((r) => [r.agentId, r.status]));
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 365);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} role="ADMIN" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Attendance History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse historical records</p>
        </div>

        <HistoryFilters
          selectedDate={selectedDate}
          today={today}
          minDate={formatDate(minDate)}
          selectedTL={selectedTL}
          teamLeads={teamLeads.map((t) => ({ id: t.id, name: t.name }))}
        />

        {records.length > 0 && (
          <div className="flex items-center gap-4 text-sm mb-4">
            <span className="text-green-600 font-medium">{present} Present</span>
            <span className="text-red-500 font-medium">{absent} Absent</span>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {records.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-400">No attendance recorded for this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Agent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Team Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {agents.map((agent) => {
                    const status = recordMap.get(agent.id);
                    return (
                      <tr key={agent.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{agent.teamLead?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {status ? (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}>
                              {status === "PRESENT" ? "Present" : "Absent"}
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
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
      </main>
    </div>
  );
}
