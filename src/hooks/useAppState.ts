import { useState } from "react";
import exampleCsv from "../../data/example.csv?raw";
import { parseCSV } from "../core/csvParser.ts";
import { refreshCriteriaValues } from "../core/criteria.ts";
import { scenarioRegistry } from "../scenarios/index.ts";
import { computeQuality, createRandomSeed, TEAM_EMOJIS, withMetrics } from "../scenarios/team-balancing/index.ts";
import type { CriteriaField, Participant } from "../types.ts";
import type { ScramblerConfig, TeamBalancingRun } from "../scenarios/team-balancing/types.ts";

const DEFAULT_PARSED = parseCSV(exampleCsv);
const DEFAULT_FILE_NAME = "example.csv";
const teamBalancingScenario = scenarioRegistry["team-balancing"];

function defaultConfig(criteria: CriteriaField[]): ScramblerConfig {
  return {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: criteria.map((criterion) => criterion.key),
  };
}

/** Owns input state and immutable snapshots of generated results. */
export function useAppState() {
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);
  const [parseError, setParseError] = useState<string>();
  const [people, setPeopleState] = useState<Participant[]>(DEFAULT_PARSED.people);
  const [criteria, setCriteria] = useState<CriteriaField[]>(DEFAULT_PARSED.criteria);
  const [config, setConfigState] = useState<ScramblerConfig>(defaultConfig(DEFAULT_PARSED.criteria));
  const [participantRevision, setParticipantRevision] = useState(0);
  const [run, setRun] = useState<TeamBalancingRun | null>(null);

  const teams = run?.result.teams ?? [];
  const quality = run?.result.quality ?? null;

  function setPeople(nextPeople: Participant[]) {
    setPeopleState(nextPeople);
    setCriteria((current) => refreshCriteriaValues(nextPeople, current));
    setParticipantRevision((revision) => revision + 1);
    setRun(null);
  }

  function setConfig(nextConfig: ScramblerConfig) {
    setConfigState(nextConfig);
    setRun(null);
  }

  function handleLoad(text: string, name: string) {
    try {
      const parsed = parseCSV(text);
      setPeopleState(parsed.people);
      setCriteria(parsed.criteria);
      setConfigState(defaultConfig(parsed.criteria));
      setParticipantRevision((revision) => revision + 1);
      setRun(null);
      setFileName(name);
      setParseError(undefined);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse CSV. Check the file and try again.");
    }
  }

  function handleScramble(seed = createRandomSeed()) {
    const errors = teamBalancingScenario.validate(people, criteria, config);
    if (errors.length > 0) {
      setParseError(errors[0]);
      return;
    }
    setParseError(undefined);
    setRun(teamBalancingScenario.generate(people, criteria, config, seed, participantRevision));
  }

  function updateTeams(update: (teams: TeamBalancingRun["result"]["teams"]) => TeamBalancingRun["result"]["teams"]) {
    setRun((current) => {
      if (!current) return current;
      const updatedTeams = withMetrics(update(current.result.teams), criteria, current.config.balanceCriteria);
      return {
        ...current,
        result: {
          teams: updatedTeams,
          quality: computeQuality(updatedTeams, current.config.balanceCriteria, criteria),
        },
      };
    });
  }

  function handleRename(teamId: string, name: string) {
    updateTeams((current) => current.map((team) => team.id === teamId ? { ...team, name } : team));
  }

  function handleCycleEmoji(teamId: string) {
    updateTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) return team;
        const index = TEAM_EMOJIS.indexOf(team.emoji);
        return { ...team, emoji: TEAM_EMOJIS[(index + 1) % TEAM_EMOJIS.length] };
      })
    );
  }

  function handleMoveMember(memberId: string, fromTeamId: string, toTeamId: string) {
    updateTeams((current) => {
      const source = current.find((team) => team.id === fromTeamId);
      const destination = current.find((team) => team.id === toTeamId);
      const member = source?.members.find((candidate) => candidate.id === memberId);
      if (!source || !destination || !member || source.id === destination.id) return current;
      return current.map((team) => {
        if (team.id === source.id) return { ...team, members: team.members.filter((candidate) => candidate.id !== member.id) };
        if (team.id === destination.id) return { ...team, members: [...team.members, member] };
        return team;
      });
    });
  }

  return {
    fileName,
    parseError,
    people,
    setPeople,
    criteria,
    config,
    setConfig,
    teams,
    quality,
    run,
    handleLoad,
    handleScramble,
    handleRename,
    handleCycleEmoji,
    handleMoveMember,
  };
}
