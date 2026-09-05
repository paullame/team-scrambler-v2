import type { CriteriaField, Participant } from "../types.ts";

/** Result envelope shared by every grouping scenario. */
export interface ScenarioRun<K extends string, C, R> {
  schemaVersion: 1;
  kind: K;
  seed: number;
  config: C;
  participantRevision: number;
  result: R;
}

/** Shared metadata for constraints; each scenario owns its parameter shape. */
export interface ScenarioConstraint<K extends string = string, P = unknown> {
  kind: K;
  strength: "hard" | "soft";
  parameters: P;
}

/** Contract implemented by an independently configurable grouping scenario. */
export interface ScenarioDefinition<K extends string, C, R> {
  id: K;
  label: string;
  validate(participants: Participant[], criteria: CriteriaField[], config: C): string[];
  generate(
    participants: Participant[],
    criteria: CriteriaField[],
    config: C,
    seed: number,
    participantRevision: number,
  ): ScenarioRun<K, C, R>;
}
