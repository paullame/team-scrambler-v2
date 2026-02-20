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

/**
 * Controls how the scrambler distributes people into teams.
 */
export type DistributionMode = "teamCount" | "teamSize";

/**
 * Configuration for the scrambler.
 */
export interface ScramblerConfig {
  /** Whether to specify a fixed number of teams or a fixed team size. */
  mode: DistributionMode;
  /** Number of teams to create (used when mode === "teamCount"). */
  teamCount: number;
  /** Target number of people per team (used when mode === "teamSize"). */
  teamSize: number;
  /** Criterion keys that should be balanced across teams. */
  balanceCriteria: string[];
}

/**
 * Per-criterion value distribution within a single team.
 */
export interface CriterionDistribution {
  key: string;
  label: string;
  /** value → count of members with that value */
  counts: Record<string, number>;
  /** value → proportion of team members with that value (0–1) */
  ratios: Record<string, number>;
}

/**
 * A single team produced by the scrambler.
 */
export interface Team {
  id: string;
  name: string;
  members: Person[];
  /** Diversity metrics, one entry per balanced criterion. */
  metrics: CriterionDistribution[];
}
