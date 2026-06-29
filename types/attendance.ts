export type AttendanceStatus = "PRESENT" | "ABSENT";

export type AttendanceRecordStatus = {
  agentId: string;
  status: AttendanceStatus;
};
