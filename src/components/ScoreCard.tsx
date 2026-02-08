import type { AnalyzeResponse } from "@/types";
import { gradeColor, scoreToLabel } from "@/utils/scoring";
import { ScoreDimension } from "./ScoreDimension";

interface ScoreCardProps {
  data: AnalyzeResponse;
}

function starString(rating: number | null): string {
  if (!rating) {
    return "☆☆☆☆☆";
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

export function ScoreCard({ data }: ScoreCardProps) {
  const { extension, scores } = data;

  return (
    <section className="card rise-in p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-16 w-16 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-900">
          {extension.icon ? (
            <img
              src={extension.icon}
              alt="Extension icon"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-black/50 dark:text-white/50">
              No icon
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl">{extension.name}</h1>
          <p className="text-sm text-black/70 dark:text-white/70">
            {starString(extension.rating)}{" "}
            {extension.rating?.toFixed(1) ?? "N/A"} (
            {extension.ratingCount?.toLocaleString() ?? "0"} ratings)
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            {extension.installs ?? "Unknown users"} |{" "}
            {extension.category ?? "Unknown category"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-gradient-to-r from-white/90 to-white/60 p-4 dark:border-white/10 dark:from-slate-900/80 dark:to-slate-900/40">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Overall Score</h2>
          <p className={`font-display text-2xl ${gradeColor(scores.grade)}`}>
            {scores.overall}/100 {scores.grade}
          </p>
        </div>
        <div className="h-3 rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-ocean to-mint"
            style={{ width: `${Math.max(4, scores.overall)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          {scoreToLabel(scores.overall)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreDimension label="Completeness" data={scores.completeness} />
        <ScoreDimension label="SEO" data={scores.seo} />
        <ScoreDimension label="Social" data={scores.socialProof} />
        <ScoreDimension label="Trust" data={scores.trust} />
      </div>
    </section>
  );
}
