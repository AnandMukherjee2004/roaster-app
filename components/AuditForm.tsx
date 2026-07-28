"use client";

import { useState } from "react";
import { AUDIT_STEPS, TOTAL_MAX_SCORE, getAuditRating } from "@/lib/auditConfig";
import { createAuditRecord } from "@/app/actions/audits";
import CustomSelect from "@/components/ui/CustomSelect";

interface AuditFormProps {
  agents: { id: string; name: string; empId: string | null }[];
  currentUserName: string;
  userRole?: string;
  today?: string;
  onSuccess?: () => void;
}

export default function AuditForm({ agents, currentUserName, userRole, today, onSuccess }: AuditFormProps) {
  const todayStr = today || new Date().toISOString().split("T")[0];
  const isAdmin = userRole === "ADMIN";

  const [agentId, setAgentId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [leadId, setLeadId] = useState("");
  const [callDate, setCallDate] = useState(todayStr);
  const [callDuration, setCallDuration] = useState("");
  const [auditorName, setAuditorName] = useState(currentUserName);

  const isReadOnly = !isAdmin && callDate !== todayStr;

  // Store scores & remarks: { [paramId]: { score: number, remark: string } }
  const [scores, setScores] = useState<Record<string, { score: number; remark: string }>>(() => {
    const initial: Record<string, { score: number; remark: string }> = {};
    AUDIT_STEPS.forEach((step) => {
      step.parameters.forEach((param) => {
        initial[param.id] = { score: 0, remark: "" };
      });
    });
    return initial;
  });

  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleStepCollapse = (stepId: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const expandAllSteps = () => setCollapsedSteps({});
  const collapseAllSteps = () => {
    const allCollapsed: Record<number, boolean> = {};
    AUDIT_STEPS.forEach((step) => {
      allCollapsed[step.id] = true;
    });
    setCollapsedSteps(allCollapsed);
  };

  // Calculate live step breakdown & totals
  const stepBreakdown = AUDIT_STEPS.map((step) => {
    let scoreGiven = 0;
    step.parameters.forEach((param) => {
      scoreGiven += scores[param.id]?.score || 0;
    });

    const percent = step.maxScore > 0 ? (scoreGiven / step.maxScore) * 100 : 0;
    return {
      stepId: step.id,
      name: step.name,
      maxScore: step.maxScore,
      scoreGiven,
      percent: Number(percent.toFixed(1)),
    };
  });

  const totalScoreGiven = stepBreakdown.reduce((acc, curr) => acc + curr.scoreGiven, 0);
  const overallPercentage = ((totalScoreGiven / TOTAL_MAX_SCORE) * 100).toFixed(1);
  const ratingInfo = getAuditRating(Number(overallPercentage));

  const setParamScore = (paramId: string, scoreVal: number) => {
    if (isReadOnly) return;
    setScores((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        score: scoreVal,
      },
    }));
  };

  const handleRemarkChange = (paramId: string, remarkVal: string) => {
    if (isReadOnly) return;
    setScores((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        remark: remarkVal,
      },
    }));
  };

  const toggleRemarkField = (paramId: string) => {
    setExpandedRemarks((prev) => ({
      ...prev,
      [paramId]: !prev[paramId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setError(null);
    setSuccessMsg(null);

    if (!agentId) {
      setError("Please select an agent to audit.");
      return;
    }
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createAuditRecord({
        agentId,
        customerName,
        leadId,
        callDate,
        callDuration,
        scores,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg("Call audit evaluation successfully submitted.");
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            const redirectUrl = userRole === "TL" ? "/history?view=audits" : "/admin?section=audits";
            window.location.href = redirectUrl;
          }, 1000);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* SIMPLE PAGE HEADER */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">
          Sales Call Audit Evaluation
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Evaluate agent consultation flow against 8 performance steps
        </p>
      </div>

      {isReadOnly && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-2xl text-xs font-semibold shadow-2xs leading-relaxed">
          ⚠️ <strong>Read-Only:</strong> Once details are filled for today, audits for previous dates cannot be evaluated or updated.
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs">
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{successMsg}</span>
        </div>
      )}

      {/* METADATA CARDS */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-2xs space-y-3">
        <h3 className="text-[11px] font-bold uppercase text-[#111111] tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E0533C]"></span>
          Call Details & Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div>
            <CustomSelect
              label="Sales Agent *"
              value={agentId}
              options={agents.map((a) => ({
                value: a.id,
                label: a.name,
                subLabel: a.empId ? `ID: ${a.empId}` : undefined,
              }))}
              onChange={(val) => setAgentId(val)}
              placeholder="Select Sales Agent"
              fullWidth
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Customer Name <span className="text-[#E0533C]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isReadOnly}
              className="w-full h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 text-xs text-[#111111] font-semibold focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Call Date <span className="text-[#E0533C]">*</span>
            </label>
            <input
              type="date"
              value={callDate}
              max={todayStr}
              onChange={(e) => setCallDate(e.target.value)}
              className="w-full h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 text-xs text-[#111111] font-semibold focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Lead ID</label>
            <input
              type="text"
              placeholder="e.g. LEAD-9821"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              disabled={isReadOnly}
              className="w-full h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 text-xs text-[#111111] font-semibold focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Call Duration</label>
            <input
              type="text"
              placeholder="e.g. 12:45"
              value={callDuration}
              onChange={(e) => setCallDuration(e.target.value)}
              disabled={isReadOnly}
              className="w-full h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 text-xs text-[#111111] font-semibold focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Auditor Name</label>
            <input
              type="text"
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
              disabled={isReadOnly}
              className="w-full h-8 sm:h-9 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 text-xs text-[#111111] font-semibold focus:bg-white focus:ring-1 focus:ring-[#E0533C] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>
      </div>

      {/* MASTER EXPAND / COLLAPSE TOOLBAR */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
          Consultation Steps ({AUDIT_STEPS.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAllSteps}
            className="text-[11px] font-bold text-[#E0533C] hover:underline"
          >
            Expand All
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={collapseAllSteps}
            className="text-[11px] font-bold text-stone-500 hover:text-[#111111] transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* SPLIT EVALUATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start max-w-full">
        {/* STEP EVALUATION CARDS (LEFT COLS) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3 min-w-0">
          {AUDIT_STEPS.map((step) => {
            const sb = stepBreakdown.find((s) => s.stepId === step.id)!;
            const isCollapsed = !!collapsedSteps[step.id];

            return (
              <div
                key={step.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/60 shadow-2xs space-y-3 transition-all"
              >
                {/* STEP HEADER BAR (CLICK TO COLLAPSE / EXPAND) */}
                <div
                  onClick={() => toggleStepCollapse(step.id)}
                  className={`flex items-center justify-between cursor-pointer select-none group ${
                    !isCollapsed ? "border-b border-stone-100 pb-3" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      {step.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-[#111111] text-xs sm:text-sm group-hover:text-[#E0533C] transition-colors">
                        {step.name.replace(/^\d+\.\s*/, "")}
                      </h3>
                      <span className="text-[10px] font-medium text-stone-400">
                        {step.parameters.length} Evaluation Criteria
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#111111]">
                        {sb.scoreGiven} <span className="text-stone-400 font-normal">/ {step.maxScore} pts</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F4F0] text-[#111111] border border-stone-200">
                        {sb.percent}%
                      </span>
                    </div>

                    {/* ROTATING CHEVRON ARROW */}
                    <div className="w-6 h-6 rounded-full bg-[#F5F4F0] flex items-center justify-center text-stone-600 group-hover:bg-[#E0533C] group-hover:text-white transition-all">
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* PARAMETERS LIST (SHOWN ONLY WHEN EXPANDED) */}
                {!isCollapsed && (
                  <div className="space-y-3 pt-0.5">
                    {step.parameters.map((param) => {
                      const currentScore = scores[param.id]?.score ?? 0;
                      const currentRemark = scores[param.id]?.remark ?? "";
                      const isRemarkExpanded = !!expandedRemarks[param.id] || currentRemark.trim().length > 0;
                      const scoreOptions = Array.from({ length: param.maxScore + 1 }, (_, i) => i);

                      return (
                        <div
                          key={param.id}
                          className="p-3 rounded-xl bg-[#F8F7F4] border border-stone-200/50 hover:border-stone-300 transition space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#111111] text-xs">
                                  {param.label}
                                </span>
                                {param.isMandatory && (
                                  <span className="text-[9px] font-bold text-[#E0533C] bg-[#E0533C]/10 px-1.5 py-0.5 rounded-full">
                                    Mandatory
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-stone-400">Max Score: {param.maxScore} pts</span>
                            </div>

                            {/* ROUNDED PILL BUTTON SELECTORS */}
                            <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-stone-200/80 shadow-2xs self-start sm:self-center">
                              {scoreOptions.map((optVal) => {
                                const isSelected = currentScore === optVal;
                                return (
                                  <button
                                    type="button"
                                    key={optVal}
                                    disabled={isReadOnly}
                                    onClick={() => setParamScore(param.id, optVal)}
                                    className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                      isSelected
                                        ? "bg-[#E0533C] text-white shadow-2xs scale-105"
                                        : "text-stone-600 hover:bg-[#F3F1ED]"
                                    }`}
                                  >
                                    {optVal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* REMARK TOGGLE */}
                          <div>
                            {!isRemarkExpanded ? (
                              <button
                                type="button"
                                onClick={() => toggleRemarkField(param.id)}
                                className="text-[10px] text-[#E0533C] font-bold hover:underline flex items-center gap-1"
                              >
                                + Add remark / observation
                              </button>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold uppercase text-stone-400">Auditor Remarks</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleRemarkField(param.id)}
                                    className="text-[9px] text-stone-400 hover:text-stone-600 font-semibold"
                                  >
                                    Hide
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={currentRemark}
                                  onChange={(e) => handleRemarkChange(param.id, e.target.value)}
                                  disabled={isReadOnly}
                                  placeholder="Enter specific feedback..."
                                  className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[#111111] font-medium focus:ring-1 focus:ring-[#E0533C] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* STICKY FINTECH SIDEBAR WIDGET */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 space-y-3 min-w-0 max-w-full">
          <div className="bg-[#111111] text-white rounded-2xl p-4 shadow-md border border-stone-800 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div>
                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Score</span>
                <div className="text-xl font-bold text-white mt-0.5">
                  {totalScoreGiven} <span className="text-xs font-normal text-stone-400">/ 100</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Achieved</span>
                <span className="text-lg font-bold text-[#E0533C]">{overallPercentage}%</span>
              </div>
            </div>

            {/* AUDIT RATING BADGE */}
            <div className="bg-stone-900 rounded-lg p-2.5 border border-stone-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300">Audit Rating:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${ratingInfo.badgeBg}`}>
                {ratingInfo.rating}
              </span>
            </div>

            {/* STEP PROGRESS BARS */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider block">Step Wise Subtotals</span>
              <div className="space-y-1.5">
                {stepBreakdown.map((sb) => (
                  <div key={sb.stepId} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-stone-300 font-medium truncate max-w-[170px]">{sb.name.replace(/^\d+\.\s*/, "")}</span>
                      <span className="text-stone-400 font-mono text-[9px] font-bold">{sb.scoreGiven}/{sb.maxScore}</span>
                    </div>
                    <div className="w-full bg-stone-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          sb.percent >= 80 ? "bg-emerald-500" : sb.percent >= 50 ? "bg-[#E0533C]" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(sb.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TERRACOTTA CTA BUTTON */}
            <div className="pt-1.5 border-t border-stone-800">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || isReadOnly}
                className="w-full py-2.5 bg-[#E0533C] hover:bg-[#C9442F] text-white font-bold text-xs rounded-full shadow-md transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Saving Audit..." : isReadOnly ? "Read-Only (Previous Date)" : "Submit Call Audit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
