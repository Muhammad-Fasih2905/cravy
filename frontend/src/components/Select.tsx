"use client";
// @ts-ignore: react-dropdown ships without types in some versions
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";

export type Opt = { value: string; label: string };

export function Select({ options, value, onChange, label }: { options: Opt[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div aria-label={label} className="min-w-[180px]">
      <Dropdown options={options} value={options.find((o) => o.value === value)} onChange={(o: Opt) => onChange(o.value)} placeholder={label} />
    </div>
  );
}
