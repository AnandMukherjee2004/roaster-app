"use client";

import { AUDIT_STEPS, getAuditRating } from "@/lib/auditConfig";

interface AuditRecordDetail {
  id: string;
  agent: { name: string; empId: string | null; email: string };
  auditor: { name: string; email: string };
  customerName: string;
  leadId: string | null;
  callDate: string | Date;
  callDuration: string | null;
  totalScore: number;
  percentage: number;
  rating: string;
  scores: any;
  stepSubtotals: any;
  createdAt: string | Date;
}

interface AuditDetailModalProps {
  audit: AuditRecordDetail | null;
  onClose: () => void;
}

export default function AuditDetailModal({ audit, onClose }: AuditDetailModalProps) {
  if (!audit) return null;

  const ratingInfo = getAuditRating(audit.percentage);
  const formattedCallDate = new Date(audit.callDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-stone-200/80 my-6">
        {/* MODAL HEADER */}
        <div className="sticky top-0 bg-[#111111] text-white p-4 sm:p-5 flex items-center justify-between z-10 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#E0533C]/20 text-[#E0533C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E0533C]/30 uppercase tracking-wider">
                Call Audit Report
              </span>
              <span className="text-[10px] text-stone-400 font-mono font-semibold">ID #{audit.id.slice(-6)}</span>
            </div>
            <h3 className="font-extrabold text-lg mt-0.5 text-white tracking-tight">
              {audit.agent.name} - {audit.customerName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-base font-bold w-8 h-8 rounded-full hover:bg-stone-800 transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* CALL DETAILS GRID */}
          <div className="bg-[#F8F7F4] rounded-xl p-4 border border-stone-200/80">
            <h4 className="font-bold text-[#111111] text-[10px] uppercase tracking-wider mb-2.5">Call Overview</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Sales Agent</span>
                <span className="font-extrabold text-[#111111] text-xs">{audit.agent.name}</span>
                {audit.agent.empId && <span className="block text-[10px] text-stone-500 font-mono">ID: {audit.agent.empId}</span>}
              </div>

              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Auditor</span>
                <span className="font-semibold text-[#111111] text-xs">{audit.auditor.name}</span>
              </div>

              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Call Date</span>
                <span className="font-semibold text-[#111111] text-xs">{formattedCallDate}</span>
              </div>

              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Customer Name</span>
                <span className="font-semibold text-[#111111] text-xs">{audit.customerName}</span>
              </div>

              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Lead ID</span>
                <span className="font-semibold text-[#111111] text-xs">{audit.leadId || "N/A"}</span>
              </div>

              <div>
                <span className="block text-stone-400 font-bold text-[9px] uppercase tracking-wider">Duration</span>
                <span className="font-semibold text-[#111111] text-xs">{audit.callDuration || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* STEP EVALUATIONS */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#111111] text-xs">Consultation Flow Breakdown</h4>
            {AUDIT_STEPS.map((step) => {
              const stepData = audit.stepSubtotals?.[step.name] || {};
              const scoreGiven = stepData.scoreGiven ?? 0;
              const pct = stepData.percentage ?? 0;

              return (
                <div key={step.id} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs">
                  <div className="p-3 bg-[#F8F7F4] border-b border-stone-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#111111] text-white font-bold text-[10px] flex items-center justify-center">
                        {step.id}
                      </span>
                      <span className="font-bold text-[#111111] text-xs">{step.name.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#111111] text-xs">{scoreGiven} / {step.maxScore} pts</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0533C]/10 text-[#E0533C]">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {step.parameters.map((param) => {
                      const itemData = audit.scores?.[param.id] || {};
                      const score = itemData.score ?? 0;
                      const remark = itemData.remark ?? "";

                      return (
                        <div key={param.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold text-stone-800 text-xs">{param.label}</span>
                            {remark && <p className="text-[10px] text-stone-500 italic mt-0.5">Note: {remark}</p>}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F5F4F0] text-[#111111] font-bold text-[11px] border border-stone-200">
                              {score} / {param.maxScore} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* OVERALL SCORE BANNER */}
          <div className="bg-[#111111] text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <div className="text-[9px] uppercase font-bold text-stone-400">Total Earned</div>
                <div className="text-xl font-bold text-white">{audit.totalScore} / 100</div>
              </div>
              <div className="h-7 w-px bg-stone-800" />
              <div>
                <div className="text-[9px] uppercase font-bold text-stone-400">Achieved</div>
                <div className="text-xl font-bold text-[#E0533C]">{audit.percentage.toFixed(2)}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-stone-400 font-bold">Rating:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ratingInfo.badgeBg}`}>
                {audit.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
