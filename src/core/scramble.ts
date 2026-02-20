import { shuffle } from "@std/random";
import type { CriteriaField, CriterionDistribution, Person, ScramblerConfig, Team } from "../types.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TEAM_EMOJIS = [
  "🦁",
  "🐯",
  "🦊",
  "🐺",
  "🦝",
  "🐻",
  "🐼",
  "🐨",
  "🦄",
  "🐲",
  "🦅",
  "🦉",
  "🦋",
  "🐬",
  "🐙",
  "🦈",
  "🌵",
  "⚡",
  "🔥",
  "🌊",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a stable stratum key for a person based on the selected balance
 * criteria. People with identical keys are in the same stratum and will be
 * spread evenly across teams.
 */
function stratumKey(person: Person, balanceCriteria: string[]): string {
  return balanceCriteria
    .map((k) => (person.criteria[k] ?? "").toLowerCase())
    .join("|");
}

/**
 * Groups an array by a key function, preserving insertion order within groups.
 */
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = map.get(k);
    if (group) {
      group.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}

/**
 * Computes per-criterion value counts for a list of team members.
 */
export function computeMetrics(
  members: Person[],
  criteria: CriteriaField[],
  balanceCriteria: string[],
): CriterionDistribution[] {
  const teamSize = members.length;
  return criteria
    .filter((c) => balanceCriteria.includes(c.key))
    .map((c) => {
      const counts: Record<string, number> = {};
      for (const person of members) {
        const value = person.criteria[c.key] ?? "";
        if (value) counts[value] = (counts[value] ?? 0) + 1;
      }
      const ratios: Record<string, number> = {};
      for (const [value, count] of Object.entries(counts)) {
        ratios[value] = teamSize > 0 ? count / teamSize : 0;
      }
      return { key: c.key, label: c.label, counts, ratios };
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Distributes people into balanced teams according to the provided config.
 *
 * Strategy: per-stratum shuffle + rotating round-robin assignment.
 *   1. Group people by their combined balanceCriteria values (the stratum).
 *   2. Shuffle each stratum group independently.
 *   3. Distribute each stratum's members across ALL teams round-robin,
 *      rotating the starting team between strata to avoid systematic bias.
 *
 * This guarantees every stratum's members are spread across all teams,
 * regardless of how many strata there are or what order they appear in.
 *
 * @param people   The full list of people to distribute.
 * @param criteria All known criteria fields (for label lookup in metrics).
 * @param config   Scrambler configuration.
 * @returns        An array of teams with members and diversity metrics.
 */
export function scramble(
  people: Person[],
  criteria: CriteriaField[],
  config: ScramblerConfig,
): Team[] {
  if (people.length === 0) return [];

  // Resolve number of teams.
  const numTeams = config.mode === "teamCount"
    ? Math.max(1, Math.min(config.teamCount, people.length))
    : Math.max(1, Math.ceil(people.length / Math.max(1, config.teamSize)));

  // 1. Initialise empty teams.
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Team ${i + 1}`,
    emoji: TEAM_EMOJIS[i % TEAM_EMOJIS.length],
    members: [],
    metrics: [],
  }));

  // 2. Group people by stratum, then shuffle each group.
  const strata = groupBy(
    people,
    (p) => stratumKey(p, config.balanceCriteria),
  );

  // 3. For each stratum, distribute its members across all teams round-robin.
  //    The starting team rotates by the size of the previous stratum so
  //    consecutive strata don't pile onto the same team.
  let offset = 0;
  for (const group of strata.values()) {
    const shuffled = shuffle(group);
    for (let i = 0; i < shuffled.length; i++) {
      teams[(offset + i) % numTeams].members.push(shuffled[i]);
    }
    offset = (offset + shuffled.length) % numTeams;
  }

  // 4. Compute diversity metrics per team.
  for (const team of teams) {
    team.metrics = computeMetrics(
      team.members,
      criteria,
      config.balanceCriteria,
    );
  }

  return teams;
}
