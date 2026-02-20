import { useState } from "react";
import type { CriteriaField, Person } from "../types.ts";

type SortDir = "asc" | "desc";

/**
 * Manages sort state for the people table.
 * Returns a stable-sorted copy of `people` plus the controls needed to
 * drive the sortable column headers.
 */
export function useTableSort(people: Person[], _criteria: CriteriaField[]) {
  const [sortKey, setSortKey] = useState<string>("displayName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...people].sort((a, b) => {
    const av = sortKey === "displayName" ? a.displayName : (a.criteria[sortKey] ?? "");
    const bv = sortKey === "displayName" ? b.displayName : (b.criteria[sortKey] ?? "");
    const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  return { sorted, sortKey, sortDir, handleSort };
}
