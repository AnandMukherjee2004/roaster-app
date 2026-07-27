"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";

import type { AttendanceStatus } from "@/types/attendance";

interface Agent {
  id: string;
  name: string;
  email: string;
  teamLeadName: string;
  teamLeadId: string;
  status: AttendanceStatus | null;
  joiningDate: string | null;
  empId: string | null;
}

interface TL {
  id: string;
  name: string;
}

interface Props {
  agents: Agent[];
  teamLeads: TL[];
  selectedDate: string;
  today: string;
  selectedTL: string;
}

export default function AdminTable({ agents, teamLeads, selectedDate, today, selectedTL }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.teamLeadName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function navigate(params: Record<string, string>) {
    const url = new URLSearchParams({ date: selectedDate, tl: selectedTL, ...params });
    router.push(`/admin?${url.toString()}`);
  }

  const tlOptions = [
    { value: "", label: "All Team Leads" },
    ...teamLeads.map(tl => ({ value: tl.id, label: tl.name })),
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex flex-wrap gap-3 items-end shadow-2xs">
        <CustomDatePicker
          value={selectedDate}
          max={today}
          onChange={(val) => navigate({ date: val })}
          label="Date"
        />
        <CustomSelect
          value={selectedTL}
          options={tlOptions}
          onChange={(val) => navigate({ tl: val })}
          placeholder="All Team Leads"
          label="Filter by Team Lead"
        />
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Search Agents</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email or TL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl text-xs font-semibold text-[#111111] focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 sm:top-3"
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-2xs">
        {agents.length === 0 ? (
          <p className="p-10 text-center text-xs font-semibold text-stone-400">No agents found.</p>
        ) : filteredAgents.length === 0 ? (
          <p className="p-10 text-center text-xs font-semibold text-stone-400">No matching agents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-stone-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200/60">
                  <th className="text-left px-5 py-3.5">Agent</th>
                  <th className="text-left px-5 py-3.5">Employee ID</th>
                  <th className="text-left px-5 py-3.5">Team Lead</th>
                  <th className="text-left px-5 py-3.5">Joining Date</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-black text-[#111111] text-xs">{agent.name}</p>
                      <p className="text-[10px] text-stone-400 font-normal">{agent.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600 font-mono text-xs font-bold">{agent.empId ?? "-"}</td>
                    <td className="px-5 py-3.5 text-stone-600 font-semibold">{agent.teamLeadName}</td>
                    <td className="px-5 py-3.5 text-stone-500 font-medium">
                      {agent.joiningDate ? new Date(agent.joiningDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                    </td>

                    <td className="px-5 py-3.5">
                      {agent.status ? (
                        <span className={`text-[11px] px-3 py-1 rounded-full font-extrabold border ${agent.status === "PRESENT"
                          ? "bg-[#E8F5E9] text-[#0D5C3A] border-[#C8E6C9]/80"
                          : agent.status === "HALF_DAY"
                            ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]/80"
                            : "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]/80"
                          }`}>
                          {agent.status === "PRESENT" ? "Present" : agent.status === "HALF_DAY" ? "Half Day" : "Absent"}
                        </span>
                      ) : (
                        <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                          Not marked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
