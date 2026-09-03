import type { CriteriaField, Participant } from "../../types.ts";
import type { ScenarioDefinition } from "../types.ts";
import { computeQuality, scramble } from "./solver.ts";
import type { ScramblerConfig, TeamBalancingResult, TeamBalancingRun } from "./types.ts";

function validate(participants: Participant[], _criteria: CriteriaField[], config: ScramblerConfig): string[] {
  const errors: string[] = [];
  if (participants.length === 0) errors.push("Add at least 1 participant before scrambling.");
  const value = config.mode === "teamCount" ? config.teamCount : config.teamSize;
  if (!Number.isFinite(value) || value < 1) errors.push("Team count and team size must be positive whole numbers.");
  return errors;
}

export const teamBalancingScenario: ScenarioDefinition<"team-balancing", ScramblerConfig, TeamBalancingResult> = {
  id: "team-balancing",
  label: "Balanced Teams",
  validate,
  generate(participants, criteria, config, seed, participantRevision): TeamBalancingRun {
    const configSnapshot = structuredClone(config);
    const teams = scramble(participants, criteria, configSnapshot, seed);
    return {
      schemaVersion: 1,
      kind: "team-balancing",
      seed,
      config: configSnapshot,
      participantRevision,
      result: { teams, quality: computeQuality(teams, configSnapshot.balanceCriteria, criteria) },
    };
  },
};

export * from "./solver.ts";
export type * from "./types.ts";
