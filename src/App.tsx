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
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto max-w-5xl px-4 py-10 flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Team Scrambler</h1>

        <CsvDropZone
          onLoad={handleLoad}
          error={parseError}
          fileName={fileName}
        />

        <div className="flex items-center gap-2 text-sm opacity-60">
          <span>{people.length} people</span>
          <span>&mdash;</span>
          <span>
            {criteria.length} criteria: {criteria.map((c) => c.label).join(", ")}
          </span>
        </div>

        <ScramblerSettings
          config={config}
          criteria={criteria}
          peopleCount={people.length}
          onChange={setConfig}
        />

        <PeopleTable
          people={people}
          criteria={criteria}
          onChange={setPeople}
        />

        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-primary btn-lg gap-2"
            onClick={handleScramble}
            disabled={people.length === 0}
          >
            <Shuffle className="size-5" />
            Scramble!
          </button>
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
                          <span className="text-xs opacity-50 uppercase tracking-wide">{m.label}</span>
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
      </div>
    </div>
  );
}

export default App;
