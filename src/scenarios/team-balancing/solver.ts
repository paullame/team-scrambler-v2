import type { CriteriaField, Participant } from "../../types.ts";
import { normalizeCriterionValue } from "../../core/criteria.ts";
import type { CriterionDistribution, CriterionQuality, ScrambleQuality, ScramblerConfig, Team } from "./types.ts";

export const TEAM_EMOJIS = ["🦁", "🐯", "🦊", "🐺", "🦝", "🐻", "🐼", "🐨", "🦄", "🐲", "🦅", "🦉", "🦋", "🐬", "🐙", "🦈", "🌵", "⚡", "🔥", "🌊"];

export function createRandomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: T[], seed: number): T[] {
  const result = [...values];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function displayValues(field: CriteriaField): Map<string, string> {
  return new Map(field.values.map((value) => [normalizeCriterionValue(value), value.trim()]));
}

export function computeMetrics(
  members: Participant[],
  criteria: CriteriaField[],
  balanceCriteria: string[],
): CriterionDistribution[] {
  return criteria
    .filter((criterion) => balanceCriteria.includes(criterion.key))
    .map((criterion) => {
      const labels = displayValues(criterion);
      const canonicalCounts = new Map<string, number>();
      for (const participant of members) {
        const value = normalizeCriterionValue(participant.criteria[criterion.key]);
        if (value) canonicalCounts.set(value, (canonicalCounts.get(value) ?? 0) + 1);
      }

      const counts: Record<string, number> = {};
      const ratios: Record<string, number> = {};
      for (const [value, count] of canonicalCounts) {
        const displayValue = labels.get(value) ?? value;
        counts[displayValue] = count;
        ratios[displayValue] = members.length > 0 ? count / members.length : 0;
      }
      return { key: criterion.key, label: criterion.label, counts, ratios };
    });
}

export function withMetrics(teams: Team[], criteria: CriteriaField[], balanceCriteria: string[]): Team[] {
  return teams.map((team) => ({ ...team, metrics: computeMetrics(team.members, criteria, balanceCriteria) }));
}

export function computeQuality(teams: Team[], balanceCriteria: string[], allCriteria: CriteriaField[]): ScrambleQuality {
  if (teams.length === 0 || balanceCriteria.length === 0) return { criteria: [], overall: 1 };
  const participants = teams.flatMap((team) => team.members);
  if (participants.length === 0) return { criteria: [], overall: 1 };

  const quality = allCriteria
    .filter((criterion) => balanceCriteria.includes(criterion.key))
    .map((criterion) => {
      const counts = new Map<string, number>();
      for (const participant of participants) {
        const value = normalizeCriterionValue(participant.criteria[criterion.key]);
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      const values = [...counts.keys()];
      if (values.length === 0) {
        return { key: criterion.key, label: criterion.label, mode: "ratio", score: 1, limited: false } satisfies CriterionQuality;
      }
      return values.length > teams.length
        ? scoreDiversity(criterion.key, criterion.label, teams, values.length)
        : scoreRatio(criterion.key, criterion.label, values, counts, participants.length, teams);
    });

  return {
    criteria: quality,
    overall: quality.length > 0 ? quality.reduce((sum, criterion) => sum + criterion.score, 0) / quality.length : 1,
  };
}

function allocationMadBounds(count: number, ratio: number, teamSizes: number[]): { best: number; worst: number } {
  let minimum = new Array<number>(count + 1).fill(Infinity);
  let maximum = new Array<number>(count + 1).fill(-Infinity);
  minimum[0] = 0;
  maximum[0] = 0;
  for (const size of teamSizes) {
    const nextMinimum = new Array<number>(count + 1).fill(Infinity);
    const nextMaximum = new Array<number>(count + 1).fill(-Infinity);
    for (let allocated = 0; allocated <= count; allocated++) {
      if (!Number.isFinite(minimum[allocated])) continue;
      for (let inTeam = 0; inTeam <= Math.min(size, count - allocated); inTeam++) {
        const deviation = Math.abs((size > 0 ? inTeam / size : 0) - ratio);
        const total = allocated + inTeam;
        nextMinimum[total] = Math.min(nextMinimum[total], minimum[allocated] + deviation);
        nextMaximum[total] = Math.max(nextMaximum[total], maximum[allocated] + deviation);
      }
    }
    minimum = nextMinimum;
    maximum = nextMaximum;
  }
  const divisor = Math.max(1, teamSizes.length);
  return { best: minimum[count] / divisor, worst: maximum[count] / divisor };
}

function scoreRatio(
  key: string,
  label: string,
  values: string[],
  globalCounts: Map<string, number>,
  participantCount: number,
  teams: Team[],
): CriterionQuality {
  let weightedActualExcess = 0;
  let weightedRange = 0;
  let limited = false;
  const teamSizes = teams.map((team) => team.members.length);
  const nonEmptyTeams = teamSizes.filter((size) => size > 0).length;
  for (const value of values) {
    const count = globalCounts.get(value) ?? 0;
    const globalRatio = count / participantCount;
    if (count < nonEmptyTeams) limited = true;
    let actualMad = 0;
    for (const team of teams) {
      const teamCount = team.members.reduce(
        (sum, participant) => sum + Number(normalizeCriterionValue(participant.criteria[key]) === value),
        0,
      );
      actualMad += Math.abs((team.members.length > 0 ? teamCount / team.members.length : 0) - globalRatio);
    }
    actualMad /= teams.length;
    const { best, worst } = allocationMadBounds(count, globalRatio, teamSizes);
    weightedActualExcess += globalRatio * Math.max(0, actualMad - best);
    weightedRange += globalRatio * Math.max(0, worst - best);
  }
  const rawScore = weightedRange > 0 ? 1 - weightedActualExcess / weightedRange : 1;
  return { key, label, mode: "ratio", score: Math.min(1, Math.max(0, rawScore)), limited };
}

function scoreDiversity(key: string, label: string, teams: Team[], distinctValueCount: number): CriterionQuality {
  let observedSum = 0;
  let bestSum = 0;
  let worstSum = 0;
  let limited = false;
  for (const team of teams) {
    const present = new Set(team.members.map((participant) => normalizeCriterionValue(participant.criteria[key])).filter(Boolean)).size;
    observedSum += present / distinctValueCount;
    bestSum += Math.min(distinctValueCount, team.members.length) / distinctValueCount;
    worstSum += team.members.length > 0 ? 1 / distinctValueCount : 0;
    if (team.members.length < distinctValueCount) limited = true;
  }
  const observed = observedSum / teams.length;
  const best = bestSum / teams.length;
  const worst = worstSum / teams.length;
  const rawScore = best > worst ? (observed - worst) / (best - worst) : 1;
  return { key, label, mode: "diversity", score: Math.min(1, Math.max(0, rawScore)), limited };
}

export function scramble(
  participants: Participant[],
  criteria: CriteriaField[],
  config: ScramblerConfig,
  seed = createRandomSeed(),
): Team[] {
  if (participants.length === 0) return [];
  const configuredValue = config.mode === "teamCount" ? config.teamCount : config.teamSize;
  const safeValue = Number.isFinite(configuredValue) ? Math.max(1, Math.floor(configuredValue)) : 1;
  const teamCount = config.mode === "teamCount" ? Math.min(safeValue, participants.length) : Math.ceil(participants.length / safeValue);
  const teams: Team[] = Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${(seed >>> 0).toString(36)}-${index + 1}`,
    name: `Team ${index + 1}`,
    emoji: TEAM_EMOJIS[index % TEAM_EMOJIS.length],
    members: [],
    metrics: [],
  }));

  const globalCounts: Record<string, Record<string, number>> = {};
  for (const key of config.balanceCriteria) {
    globalCounts[key] = {};
    for (const participant of participants) {
      const value = normalizeCriterionValue(participant.criteria[key]);
      if (value) globalCounts[key][value] = (globalCounts[key][value] ?? 0) + 1;
    }
  }
  const teamCounts: Array<Record<string, Record<string, number>>> = Array.from(
    { length: teamCount },
    () => Object.fromEntries(config.balanceCriteria.map((key) => [key, {}])),
  );

  for (const participant of shuffled(participants, seed)) {
    let bestIndex = 0;
    let bestCost = Infinity;
    for (let index = 0; index < teamCount; index++) {
      const size = teams[index].members.length;
      let cost = size * (config.balanceCriteria.length + 1);
      for (const key of config.balanceCriteria) {
        const value = normalizeCriterionValue(participant.criteria[key]);
        if (!value) continue;
        const globalRatio = (globalCounts[key][value] ?? 0) / participants.length;
        const currentCount = teamCounts[index][key][value] ?? 0;
        cost += Math.max(0, (currentCount + 1) / (size + 1) - globalRatio);
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = index;
      }
    }
    teams[bestIndex].members.push(participant);
    for (const key of config.balanceCriteria) {
      const value = normalizeCriterionValue(participant.criteria[key]);
      if (value) teamCounts[bestIndex][key][value] = (teamCounts[bestIndex][key][value] ?? 0) + 1;
    }
  }
  return withMetrics(teams, criteria, config.balanceCriteria);
}

export { normalizeCriterionValue } from "../../core/criteria.ts";
