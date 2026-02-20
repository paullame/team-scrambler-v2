import { useRef } from "react";
import { Download, Image, Shuffle } from "lucide-react";
import { useAppState } from "./hooks/useAppState.ts";
import { useExport } from "./hooks/useExport.ts";
import { CsvDropZone } from "./components/CsvDropZone.tsx";
import { PeopleTable } from "./components/PeopleTable.tsx";
import { ScramblerSettings } from "./components/ScramblerSettings.tsx";
import { TeamCard } from "./components/TeamCard.tsx";

function App() {
  const {
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
  } = useAppState();

  const gridRef = useRef<HTMLDivElement>(null);
  const { exportCsv, exportPng, isExportingPng } = useExport(teams, criteria, gridRef);

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

          {/* ── Export ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2"
              onClick={exportCsv}
              disabled={teams.length === 0}
            >
              <Download className="size-4" />
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2"
              onClick={exportPng}
              disabled={teams.length === 0 || isExportingPng}
            >
              <Image className="size-4" />
              {isExportingPng ? "Rendering…" : "Export PNG"}
            </button>
          </div>
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
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onRename={handleRename}
                  onMoveMember={handleMoveMember}
                  onCycleEmoji={handleCycleEmoji}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
