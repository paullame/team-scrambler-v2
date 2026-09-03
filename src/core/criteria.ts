import type { CriteriaField, Participant } from "../types.ts";

/** Canonical form used whenever categorical values are compared or grouped. */
export function normalizeCriterionValue(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

/** Refreshes datalist/display metadata after inline participant edits. */
export function refreshCriteriaValues(participants: Participant[], criteria: CriteriaField[]): CriteriaField[] {
  return criteria.map((criterion) => {
    const values = new Map<string, string>();
    for (const participant of participants) {
      const displayValue = participant.criteria[criterion.key]?.trim() ?? "";
      const canonicalValue = normalizeCriterionValue(displayValue);
      if (canonicalValue && !values.has(canonicalValue)) values.set(canonicalValue, displayValue);
    }
    return {
      ...criterion,
      values: [...values.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    };
  });
}
