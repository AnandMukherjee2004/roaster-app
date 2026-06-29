"use client";

import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";

interface TL {
  id: string;
  name: string;
}

interface Props {
  selectedDate: string;
  today: string;
  minDate: string;
  selectedTL: string;
  teamLeads: TL[];
}

export default function HistoryFilters({ selectedDate, today, minDate, selectedTL, teamLeads }: Props) {
  function navigate(key: string, value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.location.href = url.toString();
  }

  const tlOptions = [
    { value: "", label: "All Team Leads" },
    ...teamLeads.map(tl => ({ value: tl.id, label: tl.name })),
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end">
      <CustomDatePicker
        value={selectedDate}
        min={minDate}
        max={today}
        onChange={(val) => navigate("date", val)}
        label="Date"
      />
      <CustomSelect
        value={selectedTL}
        options={tlOptions}
        onChange={(val) => navigate("tl", val)}
        placeholder="All Team Leads"
        label="Team Lead"
      />
    </div>
  );
}
