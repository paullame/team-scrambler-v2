import { useMemo, useState } from "react";
import "./App.css";
import exampleCsv from "../data/example.csv?raw";
import { parseCSV } from "./core/csvParser.ts";
import type { ParsedCSV } from "./types.ts";

const DEFAULT_DATA: ParsedCSV = parseCSV(exampleCsv);

function App() {
  const [csvText, setCsvText] = useState<string>(exampleCsv);

  const { people, criteria } = useMemo(() => {
    try {
      return parseCSV(csvText);
    } catch {
      return DEFAULT_DATA;
    }
  }, [csvText]);

  return (
    <>
      <h1>Team Scrambler</h1>
      <p>
        {people.length} people loaded &mdash; {criteria.length} criteria:{" "}
        {criteria.map((c) => c.label).join(", ")}
      </p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            {criteria.map((c) => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>{p.displayName}</td>
              {criteria.map((c) => <td key={c.key}>{p.criteria[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default App;
