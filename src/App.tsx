import { useState } from "react";
import { Shuffle } from "lucide-react";
import exampleCsv from "../data/example.csv?raw";
import { parseCSV } from "./core/csvParser.ts";
import { scramble } from "./core/scramble.ts";
import type { CriteriaField, Person, ScramblerConfig, Team } from "./types.ts";
import { CsvDropZone } from "./components/CsvDropZone.tsx";
import { PeopleTable } from "./components/PeopleTable.tsx";
import { ScramblerSettings } from "./components/ScramblerSettings.tsx";

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

function App() {
  const [fileName, setFileName] = useState<string>(DEFAULT_FILE_NAME);
  const [parseError, setParseError] = useState<string>();
  const [people, setPeople] = useState<Person[]>(DEFAULT_PARSED.people);
  const [criteria, setCriteria] = useState<CriteriaField[]>(
    DEFAULT_PARSED.criteria,
  );
  const [config, setConfig] = useState<ScramblerConfig>(
    defaultConfig(DEFAULT_PARSED.criteria),
  );
  const [teams, setTeams] = useState<Team[]>([]);

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

  function handleScramble() {
    setTeams(scramble(people, criteria, config));
  }

  return (
    // dir="auto" puts the sidebar on the leading edge for both LTR and RTL locales
    <div className="h-dvh flex flex-col overflow-hidden bg-base-200" dir="auto">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-2 bg-base-100 border-b border-base-300">
        <h1 className="text-lg font-bold">Team Scrambler</h1>
        <div className="ms-auto flex items-center gap-2 text-sm opacity-50">
          <span>{people.length} people</span>
          {criteria.length > 0 && (
            <>
              <span>&mdash;</span>
              <span>{criteria.map((c) => c.label).join(", ")}</span>
            </>
          )}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (leading) */}
        <aside className="w-72 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto bg-base-100 border-e border-base-300">
          <CsvDropZone
            compact
            onLoad={handleLoad}
            error={parseError}
            fileName={fileName}
          />

          <ScramblerSettings
            config={config}
            criteria={criteria}
            peopleCount={people.length}
            onChange={setConfig}
          />

          <button
            type="button"
            className="btn btn-primary gap-2 mt-auto"
            onClick={handleScramble}
            disabled={people.length === 0}
          >
            <Shuffle className="size-4" />
            Scramble!
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="max-w-3xl">
            <PeopleTable
              people={people}
              criteria={criteria}
              onChange={setPeople}
            />
          </div>

          {teams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="card bg-base-100 border border-base-300">
                  <div className="card-body py-4 gap-3">
                    <h2 className="card-title text-base">{team.name}</h2>
                    <ul className="text-sm flex flex-col gap-1">
                      {team.members.map((p) => (
                        <li key={p.id} className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-primary shrink-0" />
                          {p.displayName}
                        </li>
                      ))}
                    </ul>
                    {team.metrics.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {team.metrics.map((m) => (
                          <div key={m.key} className="flex flex-col gap-1">
                            <span className="text-xs opacity-50 uppercase tracking-wide">
                              {m.label}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(m.ratios)
                                .sort(([, a], [, b]) => b - a)
                                .map(([val, ratio]) => (
                                  <span
                                    key={val}
                                    className="badge badge-ghost badge-sm"
                                    title={`${m.counts[val]} / ${team.members.length}`}
                                  >
                                    {val} {Math.round(ratio * 100)}%
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
