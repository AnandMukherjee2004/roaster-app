"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAttendance } from "@/app/actions/attendance";
import { AttendanceStatus } from "@prisma/client";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

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
}

export default function AttendanceForm({ agents, selectedDate, today, minDate, alreadySubmitted }: Props) {
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
  const [successMsg, setSuccessMsg] = useState("");

  function handleDateChange(val: string) {
    router.push(`/dashboard?date=${val}`);
  }

  function toggleAll(status: AttendanceStatus) {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) next[id] = status;
      return next;
    });
  }

  function handleSubmit() {
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
  const absentCount = Object.values(statuses).filter((s) => s === "ABSENT").length;

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <CustomDatePicker
          value={selectedDate}
          min={minDate}
          max={today}
          onChange={handleDateChange}
          label="Date"
        />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">{presentCount} Present</span>
          <span className="text-red-500 font-medium">{absentCount} Absent</span>
        </div>
      </div>

      {/* Status banner */}
      {submitted && !error && (
        <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg || "Attendance already submitted for this date. You can update it below."}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Mark all:</span>
        <button onClick={() => toggleAll("PRESENT")} className="text-xs px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition">
          Present
        </button>
        <button onClick={() => toggleAll("ABSENT")} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition">
          Absent
        </button>
      </div>

      {/* Agent list */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {agents.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No agents assigned to you yet.</p>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                <p className="text-xs text-gray-400">{agent.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatuses((p) => ({ ...p, [agent.id]: "PRESENT" }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statuses[agent.id] === "PRESENT"
                      ? "bg-green-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatuses((p) => ({ ...p, [agent.id]: "ABSENT" }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statuses[agent.id] === "ABSENT"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {agents.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl text-sm transition"
        >
          {isPending ? "Saving..." : submitted ? "Update Attendance" : "Submit Attendance"}
        </button>
      )}
    </div>
  );
}
