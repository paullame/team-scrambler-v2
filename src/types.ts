/**
 * A single person to be distributed into teams.
 * `criteria` holds all non-name columns from the CSV as key/value pairs.
 */
export interface Person {
  /** Stable unique identifier, generated at parse time. */
  id: string;
  /** Human-readable name derived from the available name columns. */
  displayName: string;
  /** All extra columns from the CSV (e.g. gender, entity, mancom). */
  criteria: Record<string, string>;
}

/**
 * Metadata about a single criterion column derived from a CSV.
 */
export interface CriteriaField {
  /** The original CSV column header (e.g. "gender"). */
  key: string;
  /** A display-friendly label (title-cased key). */
  label: string;
  /** All distinct non-empty values seen across the dataset. */
  values: string[];
}

/**
 * The result of parsing a CSV file.
 */
export interface ParsedCSV {
  people: Person[];
  criteria: CriteriaField[];
}
