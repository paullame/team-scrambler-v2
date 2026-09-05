import { teamBalancingScenario } from "./team-balancing/index.ts";

/** The scenarios currently available to the application. */
export const scenarioRegistry = {
  "team-balancing": teamBalancingScenario,
} as const;

export type ScenarioId = keyof typeof scenarioRegistry;

export { teamBalancingScenario };
export type * from "./types.ts";
