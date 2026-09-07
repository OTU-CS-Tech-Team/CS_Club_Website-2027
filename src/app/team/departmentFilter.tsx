"use client";

import { useEffect, useRef, useState } from "react";

type FilterProps = {
  departments: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

export default function DepartmentFilter({ departments, selected, onChange }: FilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="dept-filter" ref={wrapperRef}>
      <button className="dept-filter-toggle" onClick={() => setOpen((o) => !o)} type="button">
        Filter Departments
        {selected.length < departments.length ? ` (${selected.length})` : ""}
        <span className="dept-filter-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="dept-filter-panel">
          <input
            type="text"
            className="dept-filter-search"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dept-filter-list">
            {filtered.map((d) => (
              <label key={d.id} className="dept-filter-item">
                <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
                {d.name}
              </label>
            ))}
            {filtered.length === 0 && <div className="dept-filter-empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}