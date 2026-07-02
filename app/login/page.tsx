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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8 text-center">
            <img src="/logo.webp" alt="Logo" className="w-24 h-auto mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-semibold text-gray-900">Attendance Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
