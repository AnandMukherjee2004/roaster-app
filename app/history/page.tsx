import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import DatePicker from "@/components/DatePicker";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const { date } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/history");

  const today = formatDate(new Date());
  const selectedDate = date || today;
  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const agents = await prisma.user.findMany({
    where: { teamLeadId: session.user.id },
    orderBy: { name: "asc" },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: agents.map((a: { id: string }) => a.id) },
      date: targetDate,
    },
    include: { agent: true },
  });

  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  const recordMap = new Map(records.map((r) => [r.agentId, r.status]));

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} role="TL" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Attendance History</h1>
            <p className="text-sm text-gray-500 mt-0.5">View past attendance records</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Today
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
          <DatePicker selectedDate={selectedDate} today={today} minDate={formatDate(minDate)} />
          {records.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {present} Present
              </span>
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {absent} Absent
              </span>
            </div>
          )}
        </div>

        {records.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm">No attendance recorded for this date.</p>
            <Link href={`/dashboard?date=${selectedDate}`} className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
              Mark attendance for this date →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {agents.map((agent) => {
              const status = recordMap.get(agent.id);
              return (
                <div key={agent.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.email}</p>
                  </div>
                  {status ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {status === "PRESENT" ? "Present" : "Absent"}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
                      Not marked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
