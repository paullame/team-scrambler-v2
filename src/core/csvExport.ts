import type { Team } from "../scenarios/team-balancing/types.ts";
import type { CriteriaField } from "../types.ts";

function escapeCsvCell(value: string): string {
  const spreadsheetSafe = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
}

export function createTeamsCsv(teams: Team[], criteria: CriteriaField[]): string {
  const criteriaKeys = criteria.map((criterion) => criterion.key);
  const headers = ["name", ...criteriaKeys, "team"];
  const rows = teams.flatMap((team) =>
    team.members.map((member) => [
      member.displayName,
      ...criteriaKeys.map((key) => member.criteria[key] ?? ""),
      team.name,
    ])
  );
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
