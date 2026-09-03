import { parse } from "@std/csv";
import type { CriteriaField, ParsedCSV, Participant } from "../types.ts";
import { normalizeCriterionValue } from "./criteria.ts";

/**
 * Column names (lower-cased) that are treated as name fields rather than
 * balancing criteria.
 */
const NAME_COLUMNS = new Set([
  "firstname",
  "lastname",
  "displayname",
  "name",
  "fullname",
  "email",
]);
const MAX_PARTICIPANTS = 5000;

/**
 * Derives a display name from a CSV row given the available headers.
 * Priority:
 *   1. `displayName` column
 *   2. `firstName` + `lastName`
 *   3. `name` or `fullName`
 *   4. `email`
 *   5. Fallback: row index label
 */
function resolveDisplayName(
  row: Record<string, string>,
  headers: string[],
  fallback: string,
): string {
  const lower = (key: string) => headers.find((h) => h.toLowerCase() === key.toLowerCase()) ?? "";

  const col = (key: string) => row[lower(key)]?.trim() ?? "";

  const displayName = col("displayName");
  if (displayName) return displayName;

  const firstName = col("firstName");
  const lastName = col("lastName");
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  const name = col("name") || col("fullName");
  if (name) return name;

  const email = col("email");
  if (email) return email;

  return fallback;
}

/**
 * Converts a camelCase or lowercase column header to a Title-Cased label.
 * e.g. "mancom" → "Mancom", "firstName" → "First Name"
 */
function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/**
 * Parses a CSV string into a list of `Participant` objects and `CriteriaField`
 * metadata.
 *
 * @param text - Raw CSV content.
 * @returns Parsed people and criteria metadata.
 * @throws If the CSV has no rows or no recognisable name column.
 */
export function parseCSV(text: string): ParsedCSV {
  const parsedRows = parse(text, { skipFirstRow: true, strip: true }) as Record<
    string,
    string
  >[];
  const rows = parsedRows.filter((row) => Object.values(row).some((value) => value.trim().length > 0));

  if (rows.length > MAX_PARTICIPANTS) {
    throw new Error(`CSV contains ${rows.length} rows. Reduce it to ${MAX_PARTICIPANTS} participants or fewer and try again.`);
  }

  if (rows.length === 0) {
    return { people: [], criteria: [] };
  }

  const headers = Object.keys(rows[0]);

  // Partition headers into name columns and criteria columns.
  const criteriaKeys = headers.filter(
    (h) => !NAME_COLUMNS.has(h.toLowerCase()),
  );

  // Validate that we can derive a name from the available headers.
  const hasNameColumn = headers.some((h) => NAME_COLUMNS.has(h.toLowerCase()));
  if (!hasNameColumn) {
    throw new Error(
      "CSV must contain at least one name column " +
        "(firstName, lastName, displayName, name, fullName, or email).",
    );
  }

  // Collect unique values per criterion as we iterate rows.
  const valuesMap = new Map<string, Map<string, string>>(
    criteriaKeys.map((key) => [key, new Map<string, string>()]),
  );

  const people: Participant[] = rows.map((row, i) => {
    const displayName = resolveDisplayName(row, headers, `Person ${i + 1}`);

    const criteria: Record<string, string> = {};
    for (const key of criteriaKeys) {
      const value = row[key]?.trim() ?? "";
      criteria[key] = value;
      if (value) {
        const canonicalValue = normalizeCriterionValue(value);
        if (!valuesMap.get(key)!.has(canonicalValue)) valuesMap.get(key)!.set(canonicalValue, value);
      }
    }

    return {
      id: crypto.randomUUID(),
      displayName,
      criteria,
    };
  });

  const criteria: CriteriaField[] = criteriaKeys.map((key) => ({
    key,
    label: toLabel(key),
    values: Array.from(valuesMap.get(key)!.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
  }));

  return { people, criteria };
}
