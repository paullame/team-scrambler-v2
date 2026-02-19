import type { CriteriaField, ScramblerConfig } from "../types.ts";

interface Props {
  config: ScramblerConfig;
  criteria: CriteriaField[];
  peopleCount: number;
  onChange: (config: ScramblerConfig) => void;
}

export function ScramblerSettings(
  { config, criteria, peopleCount, onChange }: Props,
) {
  function set<K extends keyof ScramblerConfig>(
    key: K,
    value: ScramblerConfig[K],
  ) {
    onChange({ ...config, [key]: value });
  }

  function toggleCriterion(key: string) {
    const next = config.balanceCriteria.includes(key) ? config.balanceCriteria.filter((k) => k !== key) : [...config.balanceCriteria, key];
    set("balanceCriteria", next);
  }

  // Derived preview
  const preview: string = (() => {
    if (peopleCount === 0) return "";
    if (config.mode === "teamCount") {
      const size = Math.ceil(peopleCount / config.teamCount);
      return `≈ ${size} people / team`;
    } else {
      const count = Math.ceil(peopleCount / config.teamSize);
      return `≈ ${count} teams`;
    }
  })();

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-5 py-5">
        <h2 className="card-title text-base">Scrambler settings</h2>

        {/* Distribution mode */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium opacity-70">Distribute by</span>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                className="radio radio-sm radio-primary"
                checked={config.mode === "teamCount"}
                onChange={() => set("mode", "teamCount")}
              />
              <span className="text-sm">Number of teams</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                className="radio radio-sm radio-primary"
                checked={config.mode === "teamSize"}
                onChange={() => set("mode", "teamSize")}
              />
              <span className="text-sm">Team size</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            {config.mode === "teamCount"
              ? (
                <>
                  <label className="text-sm min-w-24" htmlFor="team-count">
                    Teams
                  </label>
                  <input
                    id="team-count"
                    type="number"
                    className="input input-sm input-bordered w-24"
                    min={1}
                    max={peopleCount || 100}
                    value={config.teamCount}
                    onChange={(e) => set("teamCount", Math.max(1, Number(e.target.value)))}
                  />
                </>
              )
              : (
                <>
                  <label className="text-sm min-w-24" htmlFor="team-size">
                    People / team
                  </label>
                  <input
                    id="team-size"
                    type="number"
                    className="input input-sm input-bordered w-24"
                    min={1}
                    max={peopleCount || 100}
                    value={config.teamSize}
                    onChange={(e) => set("teamSize", Math.max(1, Number(e.target.value)))}
                  />
                </>
              )}
            {preview && <span className="text-sm opacity-50">{preview}</span>}
          </div>
        </div>

        {/* Balance criteria */}
        {criteria.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium opacity-70">
              Balance by
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {criteria.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={config.balanceCriteria.includes(c.key)}
                    onChange={() => toggleCriterion(c.key)}
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
