import { useRef, useState } from "react";
import { Download, Image, Menu, Moon, Shuffle, Sun, Trophy, Users } from "lucide-react";
import { useAppState } from "./hooks/useAppState.ts";
import { useExport } from "./hooks/useExport.ts";
import { useTheme } from "./hooks/useTheme.ts";
import { CsvDropZone } from "./components/CsvDropZone.tsx";
import { PeopleTable } from "./components/PeopleTable.tsx";
import { QualityBanner } from "./components/QualityBanner.tsx";
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
    quality,
    handleLoad,
    handleScramble,
    handleRename,
    handleCycleEmoji,
    handleMoveMember,
  } = useAppState();

  const gridRef = useRef<HTMLDivElement>(null);
  const { exportCsv, exportPng, isExportingPng } = useExport(teams, criteria, gridRef);
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"participants" | "results">("participants");

  function handleScrambleAndSwitch() {
    handleScramble();
    setActiveTab("results");
  }

  return (
    // drawer: sidebar always-visible on lg+, slide-in overlay on smaller screens
    <div className="drawer lg:drawer-open h-dvh" dir="auto">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col overflow-hidden h-dvh bg-base-200">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center gap-3 px-4 py-2 bg-base-100 border-b border-base-300">
          {/* Hamburger – only visible below lg */}
          <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-sm -ml-1 lg:hidden" aria-label="Open sidebar">
            <Menu className="size-5" />
          </label>

          <h1 className="text-lg font-bold">Team Scrambler</h1>

          <div className="ms-auto flex items-center gap-1">
            {/* Theme toggle */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {/* Dataset info */}
            <div className="flex items-center gap-2 text-sm opacity-50 ps-1">
              <span>{people.length} people</span>
              {criteria.length > 0 && (
                <>
                  <span>&mdash;</span>
                  <span>{criteria.map((c) => c.label).join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        {/* Tab bar */}
        <div className="shrink-0 flex border-b border-base-300 bg-base-100 px-4">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "participants" ? "border-primary text-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
            onClick={() => setActiveTab("participants")}
          >
            <Users className="size-4" />
            Participants
            {people.length > 0 && <span className="badge badge-sm badge-ghost">{people.length}</span>}
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "results" ? "border-primary text-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
            onClick={() => setActiveTab("results")}
          >
            <Trophy className="size-4" />
            Results
            {teams.length > 0 && <span className="badge badge-sm badge-ghost">{teams.length} teams</span>}
          </button>
        </div>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activeTab === "participants" && (
            <div className="max-w-3xl">
              <PeopleTable
                people={people}
                criteria={criteria}
                onChange={setPeople}
              />
            </div>
          )}

          {activeTab === "results" && (
            <>
              {teams.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 opacity-40">
                    <Trophy className="size-12" />
                    <p className="text-sm">No results yet — hit Scramble! to generate teams.</p>
                  </div>
                )
                : (
                  <>
                    {quality !== null && <QualityBanner quality={quality} />}
                    <div ref={gridRef} className="grid grid-cols-[repeat(auto-fill,minmax(min(31rem,100%),1fr))] gap-4">
                      {teams.map((team, i) => (
                        <TeamCard
                          key={team.id}
                          index={i}
                          team={team}
                          onRename={handleRename}
                          onMoveMember={handleMoveMember}
                          onCycleEmoji={handleCycleEmoji}
                        />
                      ))}
                    </div>
                  </>
                )}
            </>
          )}
        </main>
      </div>

      {/* ── Drawer side (sidebar) ───────────────────────────────────────── */}
      <div className="drawer-side z-20">
        <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="w-72 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto bg-base-100 border-e border-base-300 h-full">
          {/* Mobile close button */}
          <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-sm self-end lg:hidden" aria-label="Close sidebar">
            ✕
          </label>

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
            onClick={handleScrambleAndSwitch}
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
      </div>
    </div>
  );
}

export default App;
