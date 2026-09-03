import { useState } from "react";
import { toPng } from "html-to-image";
import type { CriteriaField } from "../types.ts";
import type { Team } from "../scenarios/team-balancing/types.ts";
import { createTeamsCsv } from "../core/csvExport.ts";

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
  const [exportError, setExportError] = useState<string>();

  // ── CSV ─────────────────────────────────────────────────────────────────

  function exportCsv() {
    setExportError(undefined);
    const csv = createTeamsCsv(teams, criteria);

    trigger(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "teams.csv",
    );
  }

  // ── PNG ──────────────────────────────────────────────────────────────────

  async function exportPng() {
    const node = gridRef.current;
    if (!node) {
      setExportError("The team cards are not available to export. Open Results and try again.");
      return;
    }
    setExportError(undefined);
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
      document.body.append(a);
      a.click();
      a.remove();
    } catch {
      setExportError("PNG export failed. Try again, or use Export CSV instead.");
    } finally {
      setIsExportingPng(false);
    }
  }

  return { exportCsv, exportPng, isExportingPng, exportError };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function trigger(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Small delay before revoking so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
