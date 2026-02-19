import { useMemo, useState } from "react";
import exampleCsv from "../data/example.csv?raw";
import { parseCSV } from "./core/csvParser.ts";
import type { ParsedCSV } from "./types.ts";
import { CsvDropZone } from "./components/CsvDropZone.tsx";

const DEFAULT_DATA: ParsedCSV = parseCSV(exampleCsv);
const DEFAULT_FILE_NAME = "example.csv";

function App() {
  const [csvText, setCsvText] = useState<string>(exampleCsv);
  const [fileName, setFileName] = useState<string>(DEFAULT_FILE_NAME);
  const [parseError, setParseError] = useState<string>();

  const { people, criteria } = useMemo(() => {
    try {
      const parsed = parseCSV(csvText);
      setParseError(undefined);
      return parsed;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse CSV.");
      return DEFAULT_DATA;
    }
  }, [csvText]);

  function handleLoad(text: string, name: string) {
    setCsvText(text);
    setFileName(name);
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

        <p className="text-sm opacity-60">
          {people.length} people loaded &mdash; {criteria.length} criteria:{" "}
          {criteria.map((c) => c.label).join(", ")}
        </p>

        <div className="overflow-x-auto rounded-box border border-base-300">
          <table className="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Name</th>
                {criteria.map((c) => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.displayName}</td>
                  {criteria.map((c) => (
                    <td key={c.key}>{p.criteria[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
