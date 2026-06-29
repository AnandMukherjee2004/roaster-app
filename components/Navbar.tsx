"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  userName: string;
  role: "TL" | "ADMIN";
}

export default function Navbar({ userName, role }: NavbarProps) {
  const pathname = usePathname();

  const links =
    role === "ADMIN"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/history", label: "History" },
        ]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/history", label: "History" },
        ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Attendance</span>
          </div>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  pathname === link.href
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
            {role === "ADMIN" ? "Admin" : "Team Lead"}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
