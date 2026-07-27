"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitAttendance } from "@/app/actions/attendance";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import type { AttendanceStatus } from "@/types/attendance";

interface Agent {
  id: string;
  name: string;
  email: string;
  status: AttendanceStatus | null;
  empId?: string | null;
}

interface Props {
  agents: Agent[];
  selectedDate: string;
  today: string;
  minDate: string;
  alreadySubmitted: boolean;
  tlId: string;
  isReadOnly?: boolean;
  teamLeads?: { id: string; name: string }[];
  selectedTLId?: string;
}

export default function AttendanceForm({
  agents,
  selectedDate,
  today,
  minDate,
  alreadySubmitted,
  isReadOnly = false,
  teamLeads = [],
  selectedTLId = ""
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const agent of agents) {
      initial[agent.id] = agent.status ?? "PRESENT";
    }
    return initial;
  });
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDateChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", val);
    router.push(`/dashboard?${params.toString()}`);
  }

  function handleTLChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tl", val);
    router.push(`/dashboard?${params.toString()}`);
  }

  function toggleAll(status: AttendanceStatus) {
    if (isReadOnly) return;
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) next[id] = status;
      return next;
    });
  }

  function handleSubmit() {
    if (isReadOnly) return;
    setError("");
    startTransition(async () => {
      const records = Object.entries(statuses).map(([agentId, status]) => ({ agentId, status }));
      const result = await submitAttendance(selectedDate, records);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setSuccessMsg("Attendance saved successfully!");
      }
    });
  }

  const presentCount = Object.values(statuses).filter((s) => s === "PRESENT").length;
  const halfDayCount = Object.values(statuses).filter((s) => s === "HALF_DAY").length;
  const absentCount = Object.values(statuses).filter((s) => s === "ABSENT").length;

  return (
    <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-5 md:gap-4">
      {/* Left side: Controls (takes 2 of 5 columns) */}
      <div className="md:col-span-2 flex flex-col justify-between mb-4 md:mb-0 space-y-3">
        <div className="space-y-3">
          {/* Admin Team Lead selector */}
          {teamLeads.length > 0 && (
            <div className="bg-white border border-stone-200/60 rounded-2xl p-3.5 shadow-2xs">
              <CustomSelect
                value={selectedTLId}
                options={teamLeads.map((tl) => ({ value: tl.id, label: tl.name }))}
                onChange={handleTLChange}
                placeholder="Select a Team Lead"
                label="Filter by Team Lead"
                fullWidth
              />
            </div>
          )}

          {/* Date Selector and stats */}
          <div className="bg-white border border-stone-200/60 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
            <CustomDatePicker
              value={selectedDate}
              min={minDate}
              max={today}
              onChange={handleDateChange}
              label="Date"
            />
            <div className="flex items-center text-xs justify-between pt-2 border-t border-stone-100 flex-wrap gap-2">
              <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">Summary</span>
              <div className="flex items-center gap-2.5 font-extrabold text-[11px]">
                <span className="text-emerald-600">{presentCount} Present</span>
                <span className="text-blue-600">{halfDayCount} Half Day</span>
                <span className="text-[#E0533C]">{absentCount} Absent</span>
              </div>
            </div>
          </div>

          {/* Search and Bulk actions */}
          {agents.length > 0 && (
            <div className="bg-white border border-stone-200/60 rounded-2xl p-3.5 shadow-2xs space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl text-xs font-semibold text-[#111111] focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all"
                />
                <svg
                  className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5"
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

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Mark all:</span>
                <button
                  onClick={() => toggleAll("PRESENT")}
                  disabled={isReadOnly}
                  className="text-[10px] font-extrabold px-2.5 py-1 bg-[#E8F5E9] text-[#0D5C3A] hover:bg-[#C8E6C9] disabled:opacity-40 disabled:cursor-not-allowed rounded-full border border-[#C8E6C9]/80 transition"
                >
                  Present
                </button>
                <button
                  onClick={() => toggleAll("HALF_DAY")}
                  disabled={isReadOnly}
                  className="text-[10px] font-extrabold px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] disabled:opacity-40 disabled:cursor-not-allowed rounded-full border border-[#FDE68A]/80 transition"
                >
                  Half Day
                </button>
                <button
                  onClick={() => toggleAll("ABSENT")}
                  disabled={isReadOnly}
                  className="text-[10px] font-extrabold px-2.5 py-1 bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FCA5A5] disabled:opacity-40 disabled:cursor-not-allowed rounded-full border border-[#FCA5A5]/80 transition"
                >
                  Absent
                </button>
              </div>
            </div>
          )}

          {/* Status banner */}
          {submitted && !error && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9]/80 text-[#0D5C3A] rounded-2xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <svg className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg || "Attendance already submitted for this date."}
            </div>
          )}

          {isReadOnly && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A]/80 text-[#92400E] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed font-medium shadow-2xs">
              <strong>Read-Only:</strong> Only Admins are authorized to mark or update attendance for previous days.
            </div>
          )}

          {error && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] rounded-2xl px-3.5 py-2.5 text-xs font-semibold shadow-2xs">
              {error}
            </div>
          )}
        </div>

        {agents.length > 0 && !isReadOnly && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-[#E0533C] hover:bg-[#C9442F] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-2.5 px-4 rounded-full text-xs transition shadow-md mt-auto active:scale-95 transform"
          >
            {isPending ? "Saving..." : submitted ? "Update Attendance" : "Submit Attendance"}
          </button>
        )}
      </div>

      {/* Right side: Scrollable Agent List (takes 3 of 5 columns) */}
      <div className="md:col-span-3 flex flex-col min-h-0 bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-2xs">
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 min-h-0 custom-scrollbar-dark">
          {agents.length === 0 ? (
            <p className="p-6 text-center text-xs font-semibold text-stone-400">No agents assigned to you yet.</p>
          ) : filteredAgents.length === 0 ? (
            <p className="p-6 text-center text-xs font-semibold text-stone-400">No matching agents found.</p>
          ) : (
            filteredAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F8F7F4]/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-extrabold text-[#111111]">{agent.name}</p>
                    {agent.empId && (
                      <span className="text-[10px] bg-[#F5F4F0] text-stone-500 px-1.5 py-0.5 rounded-full font-mono font-extrabold border border-stone-200/60">
                        {agent.empId}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 font-normal">{agent.email}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "PRESENT" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                      statuses[agent.id] === "PRESENT"
                        ? "bg-[#0D5C3A] text-white shadow-2xs scale-105"
                        : "bg-[#F5F4F0] text-stone-600 disabled:opacity-40 hover:bg-[#E8F5E9] hover:text-[#0D5C3A]"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "HALF_DAY" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                      statuses[agent.id] === "HALF_DAY"
                        ? "bg-[#D97706] text-white shadow-2xs scale-105"
                        : "bg-[#F5F4F0] text-stone-600 disabled:opacity-40 hover:bg-[#FEF3C7] hover:text-[#92400E]"
                    }`}
                  >
                    Half Day
                  </button>
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "ABSENT" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                      statuses[agent.id] === "ABSENT"
                        ? "bg-[#E0533C] text-white shadow-2xs scale-105"
                        : "bg-[#F5F4F0] text-stone-600 disabled:opacity-40 hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
