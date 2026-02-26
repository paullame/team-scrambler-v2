import type { ScrambleQuality } from "../types.ts";

interface Props {
  quality: ScrambleQuality;
}

function scoreColorClass(score: number): string {
  if (score >= 0.8) return "text-success";
  if (score >= 0.55) return "text-warning";
  return "text-error";
}

function progressColorClass(score: number): string {
  if (score >= 0.8) return "progress-success";
  if (score >= 0.55) return "progress-warning";
  return "progress-error";
}

export function QualityBanner({ quality }: Props) {
  if (quality.criteria.length === 0) return null;

  const hasLimitedRatio = quality.criteria.some((c) => c.limited && c.mode === "ratio");
  const hasLimitedDiversity = quality.criteria.some((c) => c.limited && c.mode === "diversity");

  return (
    <div className="card bg-base-100 border border-base-300 max-w-3xl" aria-label="Balance quality report">
      <div className="card-body py-4 gap-3">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Balance quality</h3>
          <span className={`ms-auto text-sm font-bold ${scoreColorClass(quality.overall)}`}>
            {Math.round(quality.overall * 100)}%
          </span>
        </div>

        {/* Per-criterion rows */}
        {quality.criteria.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-sm">
            <span className="min-w-20 opacity-70 truncate" title={c.label}>{c.label}</span>
            <progress
              className={`progress flex-1 h-2 ${progressColorClass(c.score)}`}
              value={c.score}
              max={1}
              aria-label={`${c.label} balance: ${Math.round(c.score * 100)}%`}
            />
            <span className={`text-xs font-medium w-9 text-end tabular-nums ${scoreColorClass(c.score)}`}>
              {Math.round(c.score * 100)}%
            </span>
            {c.limited && (
              <span
                className="tooltip cursor-help"
                data-tip={c.mode === "diversity"
                  ? "Teams are smaller than the number of distinct values — not all values can appear in every team"
                  : "Fewer people than teams share this value — perfect balance is not achievable"}
                aria-label="Balance limited by data constraints"
              >
                ⚠️
              </span>
            )}
          </div>
        ))}

        {/* Footer notes */}
        {hasLimitedRatio && (
          <p className="text-xs opacity-50 leading-snug">
            ⚠️ Some values have fewer representatives than teams — perfect ratio balance is not achievable. Consider fewer teams or removing that criterion.
          </p>
        )}
        {hasLimitedDiversity && (
          <p className="text-xs opacity-50 leading-snug">
            ⚠️ Some criteria have more distinct values than people per team — not all values can appear in every team. This is measured as diversity (distinct
            values per team) rather than ratio balance.
          </p>
        )}
      </div>
    </div>
  );
}
