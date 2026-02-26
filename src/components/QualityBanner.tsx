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

  const hasLimited = quality.criteria.some((c) => c.limited);

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
                data-tip="Fewer people than teams share this value — perfect balance is not achievable"
                aria-label="Balance limited by small group size"
              >
                ⚠️
              </span>
            )}
          </div>
        ))}

        {/* Footer note when theoretical limit is hit */}
        {hasLimited && (
          <p className="text-xs opacity-50 leading-snug">
            Some criteria are capped below 100% — not enough people per value to have at least one in every team. Consider fewer teams or removing that
            criterion.
          </p>
        )}
      </div>
    </div>
  );
}
