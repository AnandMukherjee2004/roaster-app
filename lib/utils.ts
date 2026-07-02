export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function toLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}
