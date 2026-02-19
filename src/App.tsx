import { useState } from "react";
import exampleCsv from "../data/example.csv?raw";
import { parseCSV } from "./core/csvParser.ts";
import type { CriteriaField, Person } from "./types.ts";
import { CsvDropZone } from "./components/CsvDropZone.tsx";
import { PeopleTable } from "./components/PeopleTable.tsx";

const DEFAULT_PARSED = parseCSV(exampleCsv);
const DEFAULT_FILE_NAME = "example.csv";

function App() {
  const [fileName, setFileName] = useState<string>(DEFAULT_FILE_NAME);
  const [parseError, setParseError] = useState<string>();
  const [people, setPeople] = useState<Person[]>(DEFAULT_PARSED.people);
  const [criteria, setCriteria] = useState<CriteriaField[]>(
    DEFAULT_PARSED.criteria,
  );

  function handleLoad(text: string, name: string) {
    try {
      const { people: p, criteria: c } = parseCSV(text);
      setPeople(p);
      setCriteria(c);
      setFileName(name);
      setParseError(undefined);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse CSV.");
    }
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
            {criteria.length} criteria:{" "}
            {criteria.map((c) => c.label).join(", ")}
          </span>
        </div>

        <PeopleTable
          people={people}
          criteria={criteria}
          onChange={setPeople}
        />
      </div>
    </div>
  );
}

export default App;
