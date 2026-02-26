import { shuffle } from "@std/random";
import type { CriteriaField, CriterionDistribution, CriterionQuality, Person, ScrambleQuality, ScramblerConfig, Team } from "../types.ts";

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
 * Measures how well the current team distribution matches the global value
 * ratios for each balance criterion.
 *
 * Score is normalised per criterion: 1 = perfectly balanced, 0 = fully
 * concentrated.  The normalisation is based on the theoretical worst case for
 * the given number of teams, so scores are directly comparable across runs and
 * datasets.
 *
 * Uses the team members as the source of truth (consistent after manual swaps).
 *
 * @param teams            The current team array (with populated metrics).
 * @param balanceCriteria  Criterion keys that were balanced.
 * @param allCriteria      All known criteria fields (for label lookup).
 */
export function computeQuality(
  teams: Team[],
  balanceCriteria: string[],
  allCriteria: CriteriaField[],
): ScrambleQuality {
  if (teams.length === 0 || balanceCriteria.length === 0) {
    return { criteria: [], overall: 1 };
  }

  const numTeams = teams.length;
  // Derive the population from the actual team members so quality stays
  // consistent after manual member swaps.
  const everyone: Person[] = teams.flatMap((t) => t.members);
  const n = everyone.length;
  if (n === 0) return { criteria: [], overall: 1 };

  // Global value counts across all members.
  const globalCounts: Record<string, Record<string, number>> = {};
  for (const key of balanceCriteria) {
    globalCounts[key] = {};
    for (const p of everyone) {
      const val = (p.criteria[key] ?? "").toLowerCase();
      if (val) globalCounts[key][val] = (globalCounts[key][val] ?? 0) + 1;
    }
  }

  const criteriaQuality: CriterionQuality[] = allCriteria
    .filter((c) => balanceCriteria.includes(c.key))
    .map((c) => {
      const gc = globalCounts[c.key] ?? {};
      const values = Object.keys(gc);

      if (values.length === 0) {
        return { key: c.key, label: c.label, score: 1, limited: false };
      }

      // Weighted sum of (actual - best) and (worst - best) across values.
      // Normalising against [bestMAD, worstMAD] instead of [0, worstMAD]
      // ensures that values whose count is not divisible by numTeams still
      // score 1 when the algorithm achieves the best possible distribution
      // (e.g. 1 SLS person across 2 teams: bestMAD == worstMAD, so score = 1).
      let weightedActualExcess = 0;
      let weightedRange = 0;
      let limited = false;

      const avgTeamSize = n / numTeams;

      for (const val of values) {
        const count = gc[val];
        const R = count / n; // global ratio for this value

        // Flag: fewer representatives than teams → can't have ≥1 in every team.
        if (count < numTeams) limited = true;

        // Observed MAD: mean |teamRatio - globalRatio| across teams.
        let mad = 0;
        for (const team of teams) {
          const m = team.metrics.find((x) => x.key === c.key);
          mad += Math.abs((m?.ratios[val] ?? 0) - R);
        }
        mad /= numTeams;

        // Best-achievable MAD: distribute count as evenly as possible
        // (floor_q in T-r teams, floor_q+1 in r teams).
        const floorQ = Math.floor(count / numTeams);
        const r = count % numTeams;
        const bestMAD = (r * Math.abs((floorQ + 1) / avgTeamSize - R) +
          (numTeams - r) * Math.abs(floorQ / avgTeamSize - R)) /
          numTeams;

        // Worst-case MAD: all count people in one team, zero elsewhere.
        const worstMAD = 2 * R * (numTeams - 1) / numTeams;

        const range = worstMAD - bestMAD;
        weightedActualExcess += R * Math.max(0, mad - bestMAD);
        weightedRange += R * range;
      }

      // score = 1 when actualMAD == bestMAD; 0 when actualMAD == worstMAD.
      // When range == 0 (only one possible outcome), score = 1.
      const score = weightedRange > 0 ? Math.max(0, 1 - weightedActualExcess / weightedRange) : 1;

      return { key: c.key, label: c.label, score, limited };
    });

  const overall = criteriaQuality.length > 0 ? criteriaQuality.reduce((s, c) => s + c.score, 0) / criteriaQuality.length : 1;

  return { criteria: criteriaQuality, overall };
}

/**
 * Distributes people into balanced teams according to the provided config.
 *
 * Strategy: shuffle then greedy assignment.
 *   1. Shuffle all people randomly.
 *   2. For each person (in shuffled order), assign them to the team with the
 *      lowest cost, where cost = current team size (ensures size balance)
 *      + sum of over-representation penalties for each balance criterion
 *      (ensures criterion balance).
 *
 * This handles any number of criteria independently and correctly, unlike the
 * previous combined-stratum approach which degraded to sequential assignment
 * when strata were singletons (too many criteria → too many unique combos).
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

  // 2. Compute global value ratios per criterion (the ideal target per team).
  const globalCounts: Record<string, Record<string, number>> = {};
  for (const key of config.balanceCriteria) {
    globalCounts[key] = {};
    for (const person of people) {
      const val = (person.criteria[key] ?? "").toLowerCase();
      if (val) globalCounts[key][val] = (globalCounts[key][val] ?? 0) + 1;
    }
  }

  // Live per-team value counts, updated as people are assigned.
  const teamCounts: Array<Record<string, Record<string, number>>> = Array.from(
    { length: numTeams },
    () => Object.fromEntries(config.balanceCriteria.map((k) => [k, {}])),
  );

  // 3. Shuffle for randomness, then greedily assign each person to the team
  //    that minimises their assignment cost.
  for (const person of shuffle([...people])) {
    let bestIdx = 0;
    let bestCost = Infinity;

    for (let i = 0; i < numTeams; i++) {
      const teamSize = teams[i].members.length;

      // Primary term: current team size — ensures teams fill evenly.
      // Scaled by (numCriteria + 1) so size always dominates criterion terms.
      let cost = teamSize * (config.balanceCriteria.length + 1);

      // Secondary terms: penalise over-representation of this person's values.
      // For each criterion, adding this person raises the team ratio for their
      // value; we penalise if that ratio would exceed the global ratio.
      for (const key of config.balanceCriteria) {
        const val = (person.criteria[key] ?? "").toLowerCase();
        if (!val) continue;
        const globalRatio = (globalCounts[key][val] ?? 0) / people.length;
        const currentCount = teamCounts[i][key][val] ?? 0;
        const newRatio = (currentCount + 1) / (teamSize + 1);
        cost += Math.max(0, newRatio - globalRatio);
      }

      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }

    // Assign person to the chosen team and update live counts.
    teams[bestIdx].members.push(person);
    for (const key of config.balanceCriteria) {
      const val = (person.criteria[key] ?? "").toLowerCase();
      if (val) {
        teamCounts[bestIdx][key][val] = (teamCounts[bestIdx][key][val] ?? 0) + 1;
      }
    }
  }

  // 4. Compute diversity metrics per team.
  for (const team of teams) {
    team.metrics = computeMetrics(team.members, criteria, config.balanceCriteria);
  }

  return teams;
}
