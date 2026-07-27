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
        { href: "/dashboard", label: "Attendance" },
        { href: "/audits", label: "Agent Audits" },
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/history", label: "History" },
      ]
      : role === "MANAGER"
        ? [
          { href: "/dashboard", label: "Attendance" },
          { href: "/audits", label: "Agent Audits" },
          { href: "/admin", label: "Overview" },
          { href: "/history", label: "History" },
        ]
        : [
          { href: "/dashboard", label: "Attendance" },
          { href: "/audits", label: "Agent Audits" },
          { href: "/history", label: "History" },
        ];

  const roleLabel = role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Team Lead";

  return (
    <header className="sticky top-0 z-50 py-4 px-4 sm:px-8 bg-[#F8F7F4] shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT OUTLINED BRAND PILL */}
        <div className="border border-stone-300 rounded-full px-3.5 py-1 bg-[#FAF9F6] shadow-2xs flex items-center gap-2">
          <img src="/logo.webp" alt="Frido Logo" className="w-6 h-6 rounded-full object-contain" />
        </div>

        {/* CENTER FLOATING PILL NAV RAIL */}
        <nav className="bg-[#FAF9F6] border border-stone-200 rounded-full p-1 shadow-2xs flex items-center gap-0.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150 ${isActive
                  ? "bg-[#2A2A2A] text-white shadow-xs"
                  : "text-[#555555] hover:text-[#111111] hover:bg-[#EDECE8]"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTION PILLS */}
        <div className="flex items-center gap-1.5">
          {/* USER NAME PILL */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#FAF9F6] border border-stone-300/80 rounded-full px-3 py-1 text-[11px] font-bold text-[#222222] shadow-2xs">
            <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{userName}</span>
          </div>

          {/* SIGN OUT / NOTIFICATION CIRCLE */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="w-7 h-7 rounded-full bg-[#FAF9F6] border border-stone-300/80 hover:bg-[#EDECE8] flex items-center justify-center text-[#333333] transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
