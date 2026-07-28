"use client";

import { useState, useMemo } from "react";
import { getAuditRating } from "@/lib/auditConfig";
import AuditDetailModal from "./AuditDetailModal";
import CustomSelect from "@/components/ui/CustomSelect";

interface AuditListProps {
  audits: any[];
  onNewAuditClick?: () => void;
}

export default function AuditList({ audits, onNewAuditClick }: AuditListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeAuditModal, setActiveAuditModal] = useState<any | null>(null);

  // Unique agents list for filter
  const uniqueAgents = useMemo(() => {
    return Array.from(new Set(audits.map((a) => a.agent.name))).sort();
  }, [audits]);

  // Aggregate agent-level performance metrics
  const agentPerformanceSummaries = useMemo(() => {
    const map = new Map<string, {
      agentId: string;
      name: string;
      empId: string | null;
      email: string;
      audits: any[];
      totalAudits: number;
      avgPercentage: number;
      highestScore: number;
      lowestScore: number;
      latestAudit: any;
      excellentCount: number;
      goodCount: number;
      needsImprovementCount: number;
      poorCount: number;
    }>();

    audits.forEach((audit) => {
      const id = audit.agent.id || audit.agent.name;
      if (!map.has(id)) {
        map.set(id, {
          agentId: id,
          name: audit.agent.name,
          empId: audit.agent.empId ?? null,
          email: audit.agent.email ?? "",
          audits: [],
          totalAudits: 0,
          avgPercentage: 0,
          highestScore: 0,
          lowestScore: 100,
          latestAudit: audit,
          excellentCount: 0,
          goodCount: 0,
          needsImprovementCount: 0,
          poorCount: 0,
        });
      }

      const item = map.get(id)!;
      item.audits.push(audit);
      item.totalAudits += 1;
      if (audit.percentage > item.highestScore) item.highestScore = audit.percentage;
      if (audit.percentage < item.lowestScore) item.lowestScore = audit.percentage;

      // Track latest audit based on callDate or createdAt
      const currentDate = new Date(audit.callDate || audit.createdAt).getTime();
      const latestDate = new Date(item.latestAudit.callDate || item.latestAudit.createdAt).getTime();
      if (currentDate >= latestDate) {
        item.latestAudit = audit;
      }

      // Count rating breakdown dynamically based on percentage
      const r = getAuditRating(audit.percentage).rating;
      if (r === "Excellent") item.excellentCount += 1;
      else if (r === "Good") item.goodCount += 1;
      else if (r === "Needs Improvement") item.needsImprovementCount += 1;
      else item.poorCount += 1;
    });

    // Calculate averages and return list sorted by avg percentage descending
    return Array.from(map.values()).map((agent) => {
      const sumPct = agent.audits.reduce((acc, a) => acc + a.percentage, 0);
      const avgPct = agent.totalAudits > 0 ? Number((sumPct / agent.totalAudits).toFixed(1)) : 0;
      return {
        ...agent,
        avgPercentage: avgPct,
        overallRating: getAuditRating(avgPct),
      };
    }).sort((a, b) => b.avgPercentage - a.avgPercentage);
  }, [audits]);

  // Filtered agents for Grid View
  const filteredAgents = useMemo(() => {
    return agentPerformanceSummaries.filter((agent) => {
      if (selectedAgent !== "ALL" && agent.name !== selectedAgent) return false;
      if (selectedRating !== "ALL" && agent.overallRating.rating !== selectedRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchEmpId = agent.empId?.toLowerCase().includes(q);
        const matchEmail = agent.email.toLowerCase().includes(q);
        if (!matchName && !matchEmpId && !matchEmail) return false;
      }
      return true;
    });
  }, [agentPerformanceSummaries, selectedAgent, selectedRating, searchQuery]);

  // Filtered individual audits for Table View
  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      const dynamicRating = getAuditRating(audit.percentage).rating;
      if (selectedAgent !== "ALL" && audit.agent.name !== selectedAgent) return false;
      if (selectedRating !== "ALL" && dynamicRating !== selectedRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = audit.customerName?.toLowerCase().includes(q);
        const matchLead = audit.leadId?.toLowerCase().includes(q);
        const matchAgent = audit.agent.name?.toLowerCase().includes(q);
        if (!matchCustomer && !matchLead && !matchAgent) return false;
      }
      return true;
    });
  }, [audits, selectedAgent, selectedRating, searchQuery]);

  // Global summary statistics
  const totalAuditsCount = audits.length;
  const overallAvgPercentage = totalAuditsCount > 0
    ? (audits.reduce((sum, a) => sum + a.percentage, 0) / totalAuditsCount).toFixed(1)
    : "0";

  const totalNeedsImprovement = audits.filter((a) => a.percentage >= 60 && a.percentage < 75).length;
  const totalExcellent = audits.filter((a) => a.percentage >= 90).length;

  return (
    <div className="space-y-4">
      {/* SUMMARY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Total Audits</span>
            <span className="text-2xl font-bold text-[#111111] mt-0.5 block">{totalAuditsCount}</span>
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
            <span className="text-2xl font-bold text-[#E0533C] mt-0.5 block">{overallAvgPercentage}%</span>
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
            <span className="text-2xl font-bold text-emerald-600 mt-0.5 block">{totalExcellent}</span>
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
            <span className="text-2xl font-bold text-[#E0533C] mt-0.5 block">{totalNeedsImprovement}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E0533C]/10 text-[#E0533C] flex items-center justify-center border border-[#E0533C]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTER & VIEW TOGGLE BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/60 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto text-xs">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-56">
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

          {/* AGENT DROPDOWN */}
          <CustomSelect
            value={selectedAgent}
            onChange={(val) => setSelectedAgent(val)}
            options={[
              { value: "ALL", label: "All Agents" },
              ...uniqueAgents.map((name) => ({ value: name, label: name })),
            ]}
          />

          {/* RATING DROPDOWN */}
          <CustomSelect
            value={selectedRating}
            onChange={(val) => setSelectedRating(val)}
            options={[
              { value: "ALL", label: "All Ratings" },
              { value: "Excellent", label: "Excellent" },
              { value: "Good", label: "Good" },
              { value: "Needs Improvement", label: "Needs Improvement" },
              { value: "Poor", label: "Poor" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* REPORT VIEW TOGGLE PILLS */}
          <div className="bg-[#F5F4F0] p-1 rounded-full border border-stone-200 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-[#111111] text-white shadow-xs"
                  : "text-stone-600 hover:text-[#111111]"
              }`}
            >
              Agent Cards ({agentPerformanceSummaries.length})
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                viewMode === "table"
                  ? "bg-[#111111] text-white shadow-xs"
                  : "text-stone-600 hover:text-[#111111]"
              }`}
            >
              Call Logs ({audits.length})
            </button>
          </div>

          {onNewAuditClick && (
            <button
              onClick={onNewAuditClick}
              className="px-3.5 py-1.5 bg-[#E0533C] hover:bg-[#C9442F] text-white text-xs font-bold rounded-full shadow-xs transition transform active:scale-95 whitespace-nowrap"
            >
              + Evaluate Call
            </button>
          )}
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      {viewMode === "grid" ? (
        /* AGENT PERFORMANCE CARDS GRID */
        <div className="space-y-4">
          {filteredAgents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200/80 shadow-2xs text-center text-stone-400 text-xs font-semibold">
              No agent performance data matches your current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAgents.map((agent) => {
                const formattedLatestDate = new Date(
                  agent.latestAudit.callDate || agent.latestAudit.createdAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={agent.agentId}
                    className="bg-white rounded-[28px] p-5 sm:p-6 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-stone-300 transition-all duration-300 flex flex-col justify-between space-y-4 relative group"
                  >
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#111111] text-white font-black text-sm flex items-center justify-center shadow-xs border border-stone-800 tracking-tight">
                          {agent.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-[#111111] text-base tracking-tight group-hover:text-[#E0533C] transition-colors">
                            {agent.name}
                          </h3>
                          {agent.empId ? (
                            <span className="text-[11px] font-medium text-stone-400 font-mono">
                              ID: {agent.empId}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-stone-400 truncate max-w-[140px] block">
                              {agent.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* RATING BADGE */}
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide shadow-2xs ${agent.overallRating.badgeBg}`}
                      >
                        {agent.overallRating.rating}
                      </span>
                    </div>

                    {/* SCORE & MINIMAL PROGRESS CONTAINER */}
                    <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-200/60 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
                          Average Score
                        </span>
                        <span className="text-2xl font-black tracking-tight text-[#111111]">
                          {agent.avgPercentage}%
                        </span>
                      </div>

                      {/* SLEEK ORANGE PROGRESS BAR */}
                      <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#E0533C] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(agent.avgPercentage, 100)}%` }}
                        />
                      </div>

                      {/* HIGHEST & LOWEST STATS */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 pt-0.5">
                        <span>High Score: <strong className="text-[#111111] font-bold">{agent.highestScore}%</strong></span>
                        <span>Low Score: <strong className="text-[#111111] font-bold">{agent.lowestScore}%</strong></span>
                      </div>
                    </div>

                    {/* REFINED RATING DISTRIBUTION ROW */}
                    <div className="py-2.5 px-3 bg-[#FAF9F6]/80 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Exc</span>
                        <span className="font-bold text-[#111111]">{agent.excellentCount}</span>
                      </div>
                      <span className="text-stone-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Good</span>
                        <span className="font-bold text-[#111111]">{agent.goodCount}</span>
                      </div>
                      <span className="text-stone-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Imp</span>
                        <span className="font-bold text-[#111111]">{agent.needsImprovementCount}</span>
                      </div>
                      <span className="text-stone-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Poor</span>
                        <span className="font-bold text-[#111111]">{agent.poorCount}</span>
                      </div>
                    </div>

                    {/* LATEST CALL SUMMARY */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-stone-400 tracking-wider">Latest:</span>
                        <span className="font-bold text-[#111111] truncate max-w-[130px]">
                          {agent.latestAudit.customerName}
                        </span>
                      </div>
                      <span className="font-semibold text-stone-400 text-[10px]">{formattedLatestDate}</span>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent.name);
                          setViewMode("table");
                        }}
                        className="w-full py-2.5 px-3 bg-[#FAF9F6] hover:bg-[#EDECE8] text-[#111111] font-bold text-xs rounded-full transition border border-stone-200/80 shadow-2xs text-center"
                      >
                        View {agent.totalAudits} Calls
                      </button>

                      <button
                        onClick={() => setActiveAuditModal(agent.latestAudit)}
                        className="w-full py-2.5 px-3 bg-[#111111] hover:bg-stone-800 text-white font-bold text-xs rounded-full transition shadow-xs text-center"
                      >
                        Latest Sheet
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CALL LOGS HISTORY TABLE */
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
      )}

      {/* DETAIL MODAL */}
      <AuditDetailModal
        audit={activeAuditModal}
        onClose={() => setActiveAuditModal(null)}
      />
    </div>
  );
}

