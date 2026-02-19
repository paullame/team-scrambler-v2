import { parse } from "@std/csv";
import type { CriteriaField, ParsedCSV, Person } from "../types.ts";

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
 * Parses a CSV string into a list of `Person` objects and `CriteriaField`
 * metadata.
 *
 * @param text - Raw CSV content.
 * @returns Parsed people and criteria metadata.
 * @throws If the CSV has no rows or no recognisable name column.
 */
export function parseCSV(text: string): ParsedCSV {
  const rows = parse(text, { skipFirstRow: true, strip: true }) as Record<
    string,
    string
  >[];

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
  const valuesMap = new Map<string, Set<string>>(
    criteriaKeys.map((k) => [k, new Set<string>()]),
  );

  const people: Person[] = rows.map((row, i) => {
    const displayName = resolveDisplayName(row, headers, `Person ${i + 1}`);

    const criteria: Record<string, string> = {};
    for (const key of criteriaKeys) {
      const value = row[key]?.trim() ?? "";
      criteria[key] = value;
      if (value) valuesMap.get(key)!.add(value);
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
    values: Array.from(valuesMap.get(key)!).sort(),
  }));

  return { people, criteria };
}
