"use client";

import { useState } from "react";
import { getAuditRating } from "@/lib/auditConfig";
import AuditDetailModal from "./AuditDetailModal";
import CustomSelect from "@/components/ui/CustomSelect";

interface AuditListProps {
  audits: any[];
  onNewAuditClick?: () => void;
}

export default function AuditList({ audits, onNewAuditClick }: AuditListProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeAuditModal, setActiveAuditModal] = useState<any | null>(null);

  // Unique agents list for filter
  const uniqueAgents = Array.from(new Set(audits.map((a) => a.agent.name))).sort();

  // Filter logic
  const filteredAudits = audits.filter((audit) => {
    if (selectedAgent !== "ALL" && audit.agent.name !== selectedAgent) return false;
    if (selectedRating !== "ALL" && audit.rating !== selectedRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCustomer = audit.customerName?.toLowerCase().includes(q);
      const matchLead = audit.leadId?.toLowerCase().includes(q);
      const matchAgent = audit.agent.name?.toLowerCase().includes(q);
      if (!matchCustomer && !matchLead && !matchAgent) return false;
    }
    return true;
  });

  // Calculate summary stats
  const totalCount = filteredAudits.length;
  const avgPercentage = totalCount > 0
    ? (filteredAudits.reduce((sum, a) => sum + a.percentage, 0) / totalCount).toFixed(1)
    : "0";

  const needsImprovementCount = filteredAudits.filter((a) => a.percentage < 70).length;
  const excellentCount = filteredAudits.filter((a) => a.percentage >= 85).length;

  return (
    <div className="space-y-4">
      {/* SUMMARY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Total Audits</span>
            <span className="text-2xl font-bold text-[#111111] mt-0.5 block">{totalCount}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F5F4F0] text-[#111111] flex items-center justify-center border border-stone-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Average Score</span>
            <span className="text-2xl font-bold text-[#E0533C] mt-0.5 block">{avgPercentage}%</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E0533C]/10 text-[#E0533C] flex items-center justify-center border border-[#E0533C]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Excellent Audits</span>
            <span className="text-2xl font-bold text-emerald-600 mt-0.5 block">{excellentCount}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Needs Improvement</span>
            <span className="text-2xl font-bold text-[#E0533C] mt-0.5 block">{needsImprovementCount}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E0533C]/10 text-[#E0533C] flex items-center justify-center border border-[#E0533C]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/60 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto text-xs">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search agent, customer, lead ID..."
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

          <CustomSelect
            value={selectedAgent}
            onChange={(val) => setSelectedAgent(val)}
            options={[
              { value: "ALL", label: "All Agents" },
              ...uniqueAgents.map((name) => ({ value: name, label: name })),
            ]}
          />

          <CustomSelect
            value={selectedRating}
            onChange={(val) => setSelectedRating(val)}
            options={[
              { value: "ALL", label: "All Ratings" },
              { value: "Excellent", label: "Excellent" },
              { value: "Good", label: "Good" },
              { value: "Needs Improvement", label: "Needs Improvement" },
              { value: "Unsatisfactory", label: "Unsatisfactory" },
            ]}
          />
        </div>

        {onNewAuditClick && (
          <button
            onClick={onNewAuditClick}
            className="w-full sm:w-auto px-4 py-2 bg-[#E0533C] hover:bg-[#C9442F] text-white text-xs font-bold rounded-full shadow-xs transition transform active:scale-95 whitespace-nowrap"
          >
            + Evaluate New Call
          </button>
        )}
      </div>

      {/* AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-2xs overflow-hidden">
        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No agent audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F7F4] text-stone-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200/60">
                  <th className="py-3.5 px-4">Call Date</th>
                  <th className="py-3.5 px-4">Agent Name</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Lead ID</th>
                  <th className="py-3.5 px-4 text-center">Score / 100</th>
                  <th className="py-3.5 px-4 text-center">% Achieved</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4">Auditor</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAudits.map((audit) => {
                  const ratingInfo = getAuditRating(audit.percentage);
                  const formattedDate = new Date(audit.callDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={audit.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                      <td className="py-3.5 px-4 text-stone-600 font-semibold">{formattedDate}</td>
                      <td className="py-3.5 px-4 font-black text-[#111111]">
                        {audit.agent.name}
                        {audit.agent.empId && (
                          <span className="block text-[10px] text-stone-400 font-normal">
                            ID: {audit.agent.empId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800">{audit.customerName}</td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">{audit.leadId || "-"}</td>
                      <td className="py-3.5 px-4 text-center font-black text-[#111111]">{audit.totalScore}</td>
                      <td className="py-3.5 px-4 text-center font-black text-[#E0533C]">
                        {audit.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${ratingInfo.badgeBg}`}>
                          {audit.rating}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">{audit.auditor.name}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveAuditModal(audit)}
                          className="px-3 py-1 bg-[#F5F4F0] hover:bg-[#EDECE8] text-[#111111] font-bold rounded-full text-[11px] transition border border-stone-200/60"
                        >
                          View Sheet
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <AuditDetailModal
        audit={activeAuditModal}
        onClose={() => setActiveAuditModal(null)}
      />
    </div>
  );
}
