"use client";

import CustomDatePicker from "@/components/ui/CustomDatePicker";

interface Props {
  selectedDate: string;
  today: string;
  minDate: string;
}

export default function DatePicker({ selectedDate, today, minDate }: Props) {
  function handleChange(val: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("date", val);
    window.location.href = url.toString();
  }

  return (
    <CustomDatePicker
      value={selectedDate}
      min={minDate}
      max={today}
      onChange={handleChange}
      label="Select Date"
    />
  );
}
