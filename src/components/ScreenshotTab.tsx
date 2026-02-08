import type { AnalyzeResponse } from '@/types';

interface ScreenshotTabProps {
  data: AnalyzeResponse;
}

export function ScreenshotTab({ data }: ScreenshotTabProps) {
  const screenshots = data.extension.screenshots;

  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-2 font-display text-lg">Current Assets</h3>
        {screenshots.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
            No screenshots detected. Add at least 3 screenshots with 1280x800 or 640x400 dimensions.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((item) => (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                key={item.url}
                className="overflow-hidden rounded-xl border border-black/10 bg-white/60 p-2 text-xs dark:border-white/10 dark:bg-slate-900/40"
              >
                <img src={item.url} alt="Extension screenshot" className="h-32 w-full rounded-md object-cover" />
                <p className="mt-2 truncate">{item.width ?? '?'} x {item.height ?? '?'}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-display text-lg">Recommended Screenshot Strategy</h3>
        <ul className="space-y-2">
          {data.suggestions.screenshotStrategy.map((item) => (
            <li key={item.title} className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-slate-900/40">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-black/70 dark:text-white/70">{item.description}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ocean">Overlay: {item.overlayText}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
