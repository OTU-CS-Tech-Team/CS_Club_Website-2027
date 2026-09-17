"use client";

import { useClickSound } from "@/hooks/useClickSound";

type FilterProps = {
  departments: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

export default function DepartmentFilter({ departments, selected, onChange }: FilterProps) {
  const playClick = useClickSound();
  const allIds = departments.map((d) => d.id);
  const isAll = selected.length === allIds.length;

  return (
    <div className="dept-filter-pills">
      <button
        type="button"
        className={`dept-pill ${isAll ? "active" : ""}`}
        onClick={() => {
          playClick();
          onChange(allIds);
        }}
      >
        All
      </button>
      {departments.map((d) => (
        <button
          key={d.id}
          type="button"
          className={`dept-pill ${!isAll && selected.length === 1 && selected[0] === d.id ? "active" : ""}`}
          onClick={() => {
            playClick();
            onChange([d.id]);
          }}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}
