import type { Participant } from "../../types.ts";
import type { ScenarioRun } from "../types.ts";

export type DistributionMode = "teamCount" | "teamSize";

export interface ScramblerConfig {
  mode: DistributionMode;
  teamCount: number;
  teamSize: number;
  balanceCriteria: string[];
}

export interface CriterionDistribution {
  key: string;
  label: string;
  counts: Record<string, number>;
  ratios: Record<string, number>;
}

export interface CriterionQuality {
  key: string;
  label: string;
  mode: "ratio" | "diversity";
  score: number;
  limited: boolean;
}

export interface ScrambleQuality {
  criteria: CriterionQuality[];
  overall: number;
}

export interface Team {
  id: string;
  name: string;
  emoji: string;
  members: Participant[];
  metrics: CriterionDistribution[];
}

export interface TeamBalancingResult {
  teams: Team[];
  quality: ScrambleQuality;
}

export type TeamBalancingRun = ScenarioRun<"team-balancing", ScramblerConfig, TeamBalancingResult>;
