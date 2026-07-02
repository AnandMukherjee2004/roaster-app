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
    <div className="space-y-4">
      {/* Search Input */}
      {agents.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* List Container */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            {agents.length === 0 ? "No agents assigned." : "No matching agents found."}
          </p>
          {agents.length === 0 && (
            <Link
              href={`/dashboard?date=${selectedDate}&tab=${activeTab}`}
              className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
            >
              Mark attendance for this date →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filteredAgents.map((agent) => {
            const status = recordMapData[agent.id];
            return (
              <div key={agent.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-400">
                    {agent.email}
                  </p>
                </div>
                {status ? (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : status === "HALF_DAY"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {status === "PRESENT" ? "Present" : status === "HALF_DAY" ? "Half Day" : "Absent"}
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
    </div>
  );
}
