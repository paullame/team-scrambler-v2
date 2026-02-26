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
 * Balance quality for a single criterion after scrambling.
 */
export interface CriterionQuality {
  key: string;
  label: string;
  /**
   * How the score was computed.
   * - "ratio": low-cardinality (≤ numTeams distinct values) — measures whether
   *   each value's global proportion is evenly reflected in every team.
   * - "diversity": high-cardinality (> numTeams distinct values) — measures
   *   what fraction of all distinct values appear in each team.
   */
  mode: "ratio" | "diversity";
  /**
   * 0 (fully imbalanced) → 1 (perfectly balanced / best achievable).
   * Normalised against the theoretical best and worst case for this criterion,
   * team count, and team sizes.
   */
  score: number;
  /**
   * True when perfect balance is mathematically impossible given the data:
   * - ratio mode: at least one value has fewer representatives than teams.
   * - diversity mode: total distinct values exceed at least one team's size.
   */
  limited: boolean;
}

/**
 * Aggregate quality report produced alongside the scramble result.
 */
export interface ScrambleQuality {
  /** Per-criterion scores. */
  criteria: CriterionQuality[];
  /** Mean of all per-criterion scores (0–1). */
  overall: number;
}

/**
 * A single team produced by the scrambler.
 */
export interface Team {
  id: string;
  name: string;
  /** Emoji visual identity for the team. */
  emoji: string;
  members: Person[];
  /** Diversity metrics, one entry per balanced criterion. */
  metrics: CriterionDistribution[];
}
