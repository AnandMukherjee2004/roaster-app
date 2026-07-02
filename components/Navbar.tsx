"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  userName: string;
  role: "TL" | "ADMIN" | "MANAGER";
}

export default function Navbar({ userName, role }: NavbarProps) {
  const pathname = usePathname();

  const links =
    role === "ADMIN"
      ? [
          { href: "/dashboard", label: "Mark Attendance" },
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/history", label: "History" },
        ]
      : role === "MANAGER"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/admin", label: "Overview" },
          { href: "/history", label: "History" },
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
            <img src="/logo.webp" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
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
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            role === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : role === "MANAGER"
              ? "bg-teal-100 text-teal-700"
              : "bg-indigo-100 text-indigo-700"
          }`}>
            {role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Team Lead"}
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
