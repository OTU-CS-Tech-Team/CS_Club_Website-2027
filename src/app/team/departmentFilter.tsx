"use client";

import { useClickSound } from "@/hooks/useClickSound";

type FilterProps = {
  departments: { id: string; name: string }[];
  selected: string;
  onChange: (id: string) => void;
};

export default function DepartmentFilter({ departments, selected, onChange }: FilterProps) {
  const playClick = useClickSound();

  return (
    <div className="dept-filter-pills" role="group" aria-label="Filter team by department">
      {departments.map((d) => (
        <button
          key={d.id}
          type="button"
          aria-pressed={selected === d.id}
          className={`dept-pill ${selected === d.id ? "active" : ""}`}
          onClick={() => {
            playClick();
            onChange(d.id);
          }}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}
