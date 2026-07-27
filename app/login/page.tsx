import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F7F4] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md border border-stone-200/60 p-8 space-y-6">
          <div className="text-center">
            <img src="/logo.webp" alt="Logo" className="w-20 h-auto mx-auto mb-3 object-contain" />
            <h1 className="text-xl font-extrabold text-[#111111]">Attendance & Audit Manager</h1>
            <p className="text-xs text-stone-500 mt-1">Sign in to access your workspace</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
