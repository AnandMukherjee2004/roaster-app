export type AttendanceStatus = "PRESENT" | "ABSENT";

export type AttendanceRecordStatus = {
  agentId: string;
  status: AttendanceStatus;
};

export type TeamLeadSummary = {
  id: string;
  name: string;
};

export type AgentSummary = {
  id: string;
  name: string;
  email: string;
};

export type AgentWithTeamLead = AgentSummary & {
  teamLeadId: string | null;
  teamLead: TeamLeadSummary | null;
};
