"use client";

import { useState } from "react";
import Link from "next/link";
import type { AgentSummary, AttendanceStatus } from "@/types/attendance";

interface Props {
  agents: AgentSummary[];
  recordMapData: Record<string, AttendanceStatus>;
  selectedDate: string;
  activeTab: string;
}

export default function HistoryList({ agents, recordMapData, selectedDate, activeTab }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search Input */}
      {agents.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl text-xs font-semibold text-[#111111] focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all"
          />
          <svg
            className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 sm:top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* List Container */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white border border-stone-200/60 rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-stone-400 text-xs font-semibold">
            {agents.length === 0 ? "No agents assigned." : "No matching agents found."}
          </p>
          {agents.length === 0 && (
            <Link
              href={`/dashboard?date=${selectedDate}&tab=${activeTab}`}
              className="text-[#E0533C] hover:underline text-xs font-extrabold mt-2 inline-block"
            >
              Mark attendance for this date →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200/60 rounded-2xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
          {filteredAgents.map((agent) => {
            const status = recordMapData[agent.id];
            return (
              <div key={agent.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F7F4]/60 transition-colors">
                <div>
                  <p className="text-xs font-extrabold text-[#111111]">{agent.name}</p>
                  <p className="text-[10px] text-stone-400 font-normal">
                    {agent.email}
                  </p>
                </div>
                {status ? (
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-extrabold border ${
                      status === "PRESENT"
                        ? "bg-[#E8F5E9] text-[#0D5C3A] border-[#C8E6C9]/80"
                        : status === "HALF_DAY"
                        ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]/80"
                        : "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]/80"
                    }`}
                  >
                    {status === "PRESENT" ? "Present" : status === "HALF_DAY" ? "Half Day" : "Absent"}
                  </span>
                ) : (
                  <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                    Not marked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
