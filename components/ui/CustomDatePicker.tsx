"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;       // "YYYY-MM-DD"
  min?: string;
  max?: string;
  onChange: (val: string) => void;
  label?: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function parseDate(str: string): { y: number; m: number; d: number } | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return { y, m: m - 1, d };
}

function toStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDisplay(str: string): string {
  const p = parseDate(str);
  if (!p) return "Select date";
  return `${MONTHS[p.m].slice(0, 3)} ${p.d}, ${p.y}`;
}

export default function CustomDatePicker({ value, min, max, onChange, label }: Props) {
  const parsed = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(parsed?.y  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m  ?? new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const minP = parseDate(min ?? "");
  const maxP = parseDate(max ?? "");

  function isDisabled(y: number, m: number, d: number) {
    const ts = new Date(y, m, d).getTime();
    if (minP && ts < new Date(minP.y, minP.m, minP.d).getTime()) return true;
    if (maxP && ts > new Date(maxP.y, maxP.m, maxP.d).getTime()) return true;
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function select(d: number) {
    const str = toStr(viewYear, viewMonth, d);
    if (isDisabled(viewYear, viewMonth, d)) return;
    onChange(str);
    setOpen(false);
  }

  const selectedP = parseDate(value);

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition min-w-36"
      >
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? "text-gray-800" : "text-gray-400"}>{formatDisplay(value)}</span>
        <svg className="w-3.5 h-3.5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-gray-100 transition text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-gray-100 transition text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const disabled = isDisabled(viewYear, viewMonth, d);
              const isSelected = selectedP && selectedP.y === viewYear && selectedP.m === viewMonth && selectedP.d === d;
              const isToday = (() => {
                const t = new Date();
                return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === d;
              })();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => select(d)}
                  className={`text-xs h-8 w-full rounded-md transition font-medium
                    ${isSelected ? "bg-indigo-600 text-white" :
                      isToday ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" :
                      disabled ? "text-gray-300 cursor-not-allowed" :
                      "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
