import { useState } from "react";
import exampleCsv from "../../data/example.csv?raw";
import { parseCSV } from "../core/csvParser.ts";
import { computeMetrics, scramble, TEAM_EMOJIS } from "../core/scramble.ts";
import type { CriteriaField, Person, ScramblerConfig, Team } from "../types.ts";

// ---------------------------------------------------------------------------
// Module-level defaults (computed once at import time)
// ---------------------------------------------------------------------------

const DEFAULT_PARSED = parseCSV(exampleCsv);
const DEFAULT_FILE_NAME = "example.csv";

function defaultConfig(criteria: CriteriaField[]): ScramblerConfig {
  return {
    mode: "teamCount",
    teamCount: 4,
    teamSize: 5,
    balanceCriteria: criteria.map((c) => c.key),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Centralises all application-level state and the handlers that act on it.
 * `App` becomes a thin presentation shell that just renders what this hook
 * exposes.
 */
export function useAppState() {
  const [fileName, setFileName] = useState<string>(DEFAULT_FILE_NAME);
  const [parseError, setParseError] = useState<string | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>(DEFAULT_PARSED.people);
  const [criteria, setCriteria] = useState<CriteriaField[]>(
    DEFAULT_PARSED.criteria,
  );
  const [config, setConfig] = useState<ScramblerConfig>(
    defaultConfig(DEFAULT_PARSED.criteria),
  );
  const [teams, setTeams] = useState<Team[]>([]);

  // ── CSV loading ────────────────────────────────────────────────────────

  function handleLoad(text: string, name: string) {
    try {
      const { people: p, criteria: c } = parseCSV(text);
      setPeople(p);
      setCriteria(c);
      setConfig(defaultConfig(c));
      setTeams([]);
      setFileName(name);
      setParseError(undefined);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse CSV.");
    }
  }

  // ── Scrambling ─────────────────────────────────────────────────────────

  function handleScramble() {
    setTeams(scramble(people, criteria, config));
  }

  // ── Team card interactions ─────────────────────────────────────────────

  function handleRename(teamId: string, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
  }

  function handleCycleEmoji(teamId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const idx = TEAM_EMOJIS.indexOf(t.emoji);
        const next = TEAM_EMOJIS[(idx + 1) % TEAM_EMOJIS.length];
        return { ...t, emoji: next };
      })
    );
  }

  function handleMoveMember(
    memberId: string,
    fromTeamId: string,
    toTeamId: string,
  ) {
    setTeams((prev) => {
      const source = prev.find((t) => t.id === fromTeamId);
      if (!source) return prev;
      const member = source.members.find((m) => m.id === memberId);
      if (!member) return prev;

      return prev.map((t) => {
        if (t.id === fromTeamId) {
          const members = t.members.filter((m) => m.id !== memberId);
          return {
            ...t,
            members,
            metrics: computeMetrics(members, criteria, config.balanceCriteria),
          };
        }
        if (t.id === toTeamId) {
          const members = [...t.members, member];
          return {
            ...t,
            members,
            metrics: computeMetrics(members, criteria, config.balanceCriteria),
          };
        }
        return t;
      });
    });
  }

  // ── Public surface ─────────────────────────────────────────────────────

  return {
    fileName,
    parseError,
    people,
    setPeople,
    criteria,
    config,
    setConfig,
    teams,
    handleLoad,
    handleScramble,
    handleRename,
    handleCycleEmoji,
    handleMoveMember,
  };
}
