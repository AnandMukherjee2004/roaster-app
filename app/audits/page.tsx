import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getAgentsList } from "@/app/actions/audits";
import AuditForm from "@/components/AuditForm";
import { formatDate } from "@/lib/utils";

export default async function AuditsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agents = await getAgentsList();
  const today = formatDate(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      <Navbar userName={session.user.name} role={session.user.role as any} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <AuditForm
          agents={agents}
          currentUserName={session.user.name}
          userRole={session.user.role}
          today={today}
        />
      </main>
    </div>
  );
}
