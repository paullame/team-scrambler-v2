import { useRef, useState } from "react";
import type { Team } from "../types.ts";

interface TeamCardProps {
  team: Team;
  index: number;
  onRename: (teamId: string, name: string) => void;
  onMoveMember: (memberId: string, fromTeamId: string, toTeamId: string) => void;
  onCycleEmoji: (teamId: string) => void;
}

export function TeamCard({ team, index, onRename, onMoveMember, onCycleEmoji }: TeamCardProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Inline name editing ──────────────────────────────────────────────────

  function startEditing() {
    setEditingName(team.name);
    // Focus deferred so the input is mounted first
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitName() {
    const trimmed = editingName?.trim();
    if (trimmed) onRename(team.id, trimmed);
    setEditingName(null);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitName();
    if (e.key === "Escape") setEditingName(null);
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, memberId: string) {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ memberId, fromTeamId: team.id }),
    );
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when leaving the card itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const { memberId, fromTeamId } = JSON.parse(
        e.dataTransfer.getData("text/plain"),
      ) as { memberId: string; fromTeamId: string };
      if (fromTeamId === team.id) return; // no-op: same team
      onMoveMember(memberId, fromTeamId, team.id);
    } catch {
      // Ignore malformed drag data
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        "card bg-base-100 border transition-shadow animate-card-enter",
        isDragOver ? "border-primary ring-2 ring-primary ring-offset-1 shadow-lg" : "border-base-300",
      ].join(" ")}
      style={{ animationDelay: `${index * 55}ms` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="card-body py-4 gap-3">
        {/* Card title: emoji + editable name */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xl leading-none cursor-pointer select-none hover:scale-110 active:scale-95 transition-transform"
            title="Click to change emoji"
            onClick={() => onCycleEmoji(team.id)}
            aria-label="Change team emoji"
          >
            {team.emoji}
          </button>

          {editingName !== null
            ? (
              <input
                ref={inputRef}
                type="text"
                className="input input-sm input-bordered font-bold text-base w-full max-w-48"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKeyDown}
                autoFocus
              />
            )
            : (
              <h2
                className="card-title text-base cursor-pointer hover:underline hover:decoration-dotted"
                title="Click to rename"
                onClick={startEditing}
              >
                {team.name}
              </h2>
            )}

          <span className="text-xs opacity-40 ms-auto shrink-0">
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Member list — each row is draggable */}
        <ul className="text-sm flex flex-col gap-1">
          {team.members.map((p) => (
            <li
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, p.id)}
              className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none rounded px-1 hover:bg-base-200 transition-colors"
              title="Drag to move to another team"
            >
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
              {p.displayName}
            </li>
          ))}
        </ul>

        {/* Metrics badges */}
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
  );
}
