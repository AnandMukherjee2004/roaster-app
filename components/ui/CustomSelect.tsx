"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  label,
  icon,
  fullWidth = false,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative inline-block ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* SELECT TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 bg-[#F5F4F0] border border-stone-200/80 rounded-xl px-3 h-8 sm:h-9 text-xs font-semibold text-[#111111] hover:bg-[#EAE8E2] hover:border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#E0533C] transition-all ${
          fullWidth ? "w-full" : "min-w-[180px]"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon ? (
            <span className="text-stone-500">{icon}</span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#E0533C] flex-shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 flex-shrink-0 ${
            open ? "rotate-180 text-[#E0533C]" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* DROPDOWN POPOVER MENU */}
      {open && (
        <div className="absolute left-0 mt-2 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white border border-stone-200/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.1)] py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar-dark">
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-stone-400 font-medium">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#E0533C]/10 text-[#E0533C]"
                      : "text-[#111111] hover:bg-[#F8F7F4]"
                  }`}
                >
                  <div className="flex flex-col truncate">
                    <span>{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-stone-400 font-normal">{opt.subLabel}</span>
                    )}
                  </div>

                  {isSelected && (
                    <svg className="w-4 h-4 text-[#E0533C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
