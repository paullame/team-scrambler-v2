import { useState } from "react";
import { toPng } from "html-to-image";
import type { CriteriaField, Team } from "../types.ts";

/**
 * Provides CSV and PNG export actions for the current set of teams.
 *
 * @param teams     The teams to export.
 * @param criteria  All criteria fields (used to build CSV column headers).
 * @param gridRef   A ref attached to the team-cards grid DOM node (for PNG).
 */
export function useExport(
  teams: Team[],
  criteria: CriteriaField[],
  gridRef: React.RefObject<HTMLDivElement | null>,
) {
  const [isExportingPng, setIsExportingPng] = useState(false);

  // ── CSV ─────────────────────────────────────────────────────────────────

  function exportCsv() {
    const criteriaKeys = criteria.map((c) => c.key);
    const headers = ["name", ...criteriaKeys, "team"];

    const rows = teams.flatMap((team) =>
      team.members.map((member) => [
        member.displayName,
        ...criteriaKeys.map((k) => member.criteria[k] ?? ""),
        team.name,
      ])
    );

    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    trigger(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "teams.csv",
    );
  }

  // ── PNG ──────────────────────────────────────────────────────────────────

  async function exportPng() {
    const node = gridRef.current;
    if (!node) return;
    setIsExportingPng(true);
    try {
      // Render at 2× for sharper output on retina screens.
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
          // Ensure the snapshot has a solid background regardless of theme.
          borderRadius: "0",
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "teams.png";
      a.click();
    } finally {
      setIsExportingPng(false);
    }
  }

  return { exportCsv, exportPng, isExportingPng };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function trigger(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Small delay before revoking so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
