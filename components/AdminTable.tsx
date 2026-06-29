"use client";

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
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-wrap gap-4 items-end">
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
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {agents.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-400">No agents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Team Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{agent.teamLeadName}</td>
                    <td className="px-4 py-3">
                      {agent.status ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          agent.status === "PRESENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {agent.status === "PRESENT" ? "Present" : "Absent"}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-600">
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
