import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import AttendanceForm from "@/components/AttendanceForm";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { date } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const today = formatDate(new Date());
  const selectedDate = date || today;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 7);
  const minDateStr = formatDate(minDate);

  const agents = await prisma.user.findMany({
    where: { teamLeadId: session.user.id },
    orderBy: { name: "asc" },
  });

  const targetDate = new Date(selectedDate + "T00:00:00.000Z");

  const existingRecords = await prisma.attendanceRecord.findMany({
    where: {
      agentId: { in: agents.map((a) => a.id) },
      date: targetDate,
    },
  });

  const recordMap = new Map(existingRecords.map((r) => [r.agentId, r.status]));
  const alreadySubmitted = existingRecords.length === agents.length && agents.length > 0;

  const agentsWithStatus = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    status: recordMap.get(agent.id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} role="TL" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Mark Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} under your team
          </p>
        </div>

        <AttendanceForm
          agents={agentsWithStatus}
          selectedDate={selectedDate}
          today={today}
          minDate={minDateStr}
          alreadySubmitted={alreadySubmitted}
          tlId={session.user.id}
        />
      </main>
    </div>
  );
}
