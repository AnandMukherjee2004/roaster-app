export interface AuditParameter {
  id: string;
  label: string;
  maxScore: number;
  isMandatory?: boolean;
}

export interface ConsultationStep {
  id: number;
  name: string;
  maxScore: number;
  parameters: AuditParameter[];
}

export const AUDIT_STEPS: ConsultationStep[] = [
  {
    id: 1,
    name: "1. Connect & Build Trust",
    maxScore: 10,
    parameters: [
      { id: "intro_self_frido", label: "Introduced self and Frido clearly", maxScore: 3 },
      { id: "recall_brand", label: "Made the customer recall the brand name", maxScore: 2 },
      { id: "set_agenda", label: "Set a clear agenda for the call", maxScore: 5 },
    ],
  },
  {
    id: 2,
    name: "2. Discover the Customer's Situation",
    maxScore: 20,
    parameters: [
      { id: "who_product_for", label: "Asked who the product is for (Mandatory)", maxScore: 3, isMandatory: true },
      { id: "medical_condition", label: "Asked medical condition/mobility challenge & since when (Mandatory)", maxScore: 3, isMandatory: true },
      { id: "daily_routine", label: "Asked about the customer's daily routine", maxScore: 2 },
      { id: "usage_location", label: "Asked indoor / outdoor / both usage (Mandatory)", maxScore: 3, isMandatory: true },
      { id: "has_caretaker", label: "Asked if there is a caretaker (Mandatory)", maxScore: 3, isMandatory: true },
      { id: "travel_freq", label: "Asked about frequency of travel", maxScore: 2 },
      { id: "prior_aid", label: "Asked about prior use of any mobility aid (Mandatory)", maxScore: 3, isMandatory: true },
      { id: "ask_more_pitch_less", label: "Practiced 'Ask more, pitch less' throughout", maxScore: 1 },
    ],
  },
  {
    id: 3,
    name: "3. Diagnose the Real Need",
    maxScore: 15,
    parameters: [
      { id: "functional_limitations", label: "Identified functional limitations", maxScore: 4 },
      { id: "safety_concerns", label: "Identified safety concerns", maxScore: 4 },
      { id: "caregiver_challenges", label: "Identified caregiver challenges", maxScore: 3 },
      { id: "lifestyle_reqs", label: "Identified lifestyle requirements", maxScore: 4 },
    ],
  },
  {
    id: 4,
    name: "4. Enhance the Experience",
    maxScore: 10,
    parameters: [
      { id: "physio_consult", label: "Pitched free Physiotherapist Consultation", maxScore: 5 },
      { id: "demo_call", label: "Pitched live Video Call Product Demo", maxScore: 5 },
    ],
  },
  {
    id: 5,
    name: "5. Educate the Customer",
    maxScore: 15,
    parameters: [
      { id: "trusted_advisor", label: "Positioned self as a trusted advisor", maxScore: 3 },
      { id: "diff_vs_alternatives", label: "Explained key differences vs alternatives", maxScore: 3 },
      { id: "relevant_features", label: "Highlighted features relevant to customer's use case", maxScore: 3 },
      { id: "long_term_value", label: "Focused on long-term value, not just price", maxScore: 3 },
      { id: "buying_mistakes", label: "Educated on common buying mistakes", maxScore: 3 },
    ],
  },
  {
    id: 6,
    name: "6. Recommend the Best-Fit Solution",
    maxScore: 15,
    parameters: [
      { id: "restated_need", label: "Clearly restated the customer's need", maxScore: 3 },
      { id: "recommend_product", label: "Recommended an appropriate product", maxScore: 5 },
      { id: "explained_benefit", label: "Explained the benefit of the recommendation", maxScore: 4 },
      { id: "explained_why", label: "Explained WHY this was recommended", maxScore: 3 },
    ],
  },
  {
    id: 7,
    name: "7. Address Concerns",
    maxScore: 10,
    parameters: [
      { id: "listened_no_interrupt", label: "Listened without interrupting", maxScore: 2 },
      { id: "clarified_concern", label: "Clarified the concern before responding", maxScore: 2 },
      { id: "empathy_and_facts", label: "Responded with empathy and facts", maxScore: 3 },
      { id: "concern_resolved", label: "Confirmed the concern was resolved", maxScore: 2 },
      { id: "handled_concern_category", label: "Handled the relevant concern category (Price/Family/Brand/Delivery/After-Sales)", maxScore: 1 },
    ],
  },
  {
    id: 8,
    name: "8. Guide the Buying Decision",
    maxScore: 5,
    parameters: [
      { id: "avoided_generic_closing", label: "Avoided a generic closing question (\"Would you like to buy?\")", maxScore: 3 },
      { id: "assumptive_closing", label: "Used a confident, assumptive closing statement", maxScore: 2 },
    ],
  },
];

export const TOTAL_MAX_SCORE = 100;

export function getAuditRating(percentage: number): { rating: string; color: string; badgeBg: string; textHex: string } {
  if (percentage >= 90) {
    return {
      rating: "Excellent",
      color: "emerald",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold",
      textHex: "#34D399",
    };
  } else if (percentage >= 75) {
    return {
      rating: "Good",
      color: "blue",
      badgeBg: "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-extrabold",
      textHex: "#60A5FA",
    };
  } else if (percentage >= 60) {
    return {
      rating: "Needs Improvement",
      color: "amber",
      badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold",
      textHex: "#FBBF24",
    };
  } else {
    return {
      rating: "Poor",
      color: "rose",
      badgeBg: "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold",
      textHex: "#F87171",
    };
  }
}
