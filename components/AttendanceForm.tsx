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
    <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-5 md:gap-6">
      {/* Left side: Controls (takes 2 of 5 columns) */}
      <div className="md:col-span-2 flex flex-col justify-between mb-4 md:mb-0 space-y-4">
        <div className="space-y-4">
          {/* Admin Team Lead selector */}
          {teamLeads.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <CustomSelect
                value={selectedTLId}
                options={teamLeads.map((tl) => ({ value: tl.id, label: tl.name }))}
                onChange={handleTLChange}
                placeholder="Select a Team Lead"
                label="Filter by Team Lead"
              />
            </div>
          )}

          {/* Date Selector and stats */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <CustomDatePicker
              value={selectedDate}
              min={minDate}
              max={today}
              onChange={handleDateChange}
              label="Date"
            />
            <div className="flex items-center gap-4 text-sm justify-between pt-1 border-t border-gray-50 flex-wrap">
              <span className="text-gray-500">Summary</span>
              <div className="flex items-center gap-3">
                <span className="text-green-600 font-medium">{presentCount} Present</span>
                <span className="text-blue-600 font-medium">{halfDayCount} Half Day</span>
                <span className="text-red-500 font-medium">{absentCount} Absent</span>
              </div>
            </div>
          </div>

          {/* Search and Bulk actions */}
          {agents.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-3"
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

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Mark all:</span>
                <button
                  onClick={() => toggleAll("PRESENT")}
                  disabled={isReadOnly}
                  className="text-xs px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition"
                >
                  Present
                </button>
                <button
                  onClick={() => toggleAll("HALF_DAY")}
                  disabled={isReadOnly}
                  className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition"
                >
                  Half Day
                </button>
                <button
                  onClick={() => toggleAll("ABSENT")}
                  disabled={isReadOnly}
                  className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition"
                >
                  Absent
                </button>
              </div>
            </div>
          )}

          {/* Status banner */}
          {submitted && !error && (
            <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg || "Attendance already submitted for this date."}
            </div>
          )}

          {isReadOnly && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl px-4 py-3 text-xs leading-relaxed">
              ⚠️ <strong>Read-Only:</strong> Only Admins are authorized to mark or update attendance for previous days.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {agents.length > 0 && !isReadOnly && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl text-sm transition mt-auto"
          >
            {isPending ? "Saving..." : submitted ? "Update Attendance" : "Submit Attendance"}
          </button>
        )}
      </div>

      {/* Right side: Scrollable Agent List (takes 3 of 5 columns) */}
      <div className="md:col-span-3 flex flex-col min-h-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-0">
          {agents.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No agents assigned to you yet.</p>
          ) : filteredAgents.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No matching agents found.</p>
          ) : (
            filteredAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/30 transition">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "PRESENT" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statuses[agent.id] === "PRESENT"
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-green-50 hover:text-green-600"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "HALF_DAY" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statuses[agent.id] === "HALF_DAY"
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    Half Day
                  </button>
                  <button
                    onClick={() => !isReadOnly && setStatuses((p) => ({ ...p, [agent.id]: "ABSENT" }))}
                    disabled={isReadOnly}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      statuses[agent.id] === "ABSENT"
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 disabled:opacity-40 hover:bg-red-50 hover:text-red-500"
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
