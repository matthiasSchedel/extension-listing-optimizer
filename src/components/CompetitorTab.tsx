import type { AnalyzeResponse } from '@/types';

interface CompetitorTabProps {
  data: AnalyzeResponse;
}

function asNumber(value: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  return value.toLocaleString();
}

export function CompetitorTab({ data }: CompetitorTabProps) {
  const competitors = data.competitors.slice(0, 3);

  if (competitors.length === 0) {
    return <p className="text-sm">No competitor links were detected from the listing page.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse rounded-xl border border-black/10 text-sm dark:border-white/10">
        <thead>
          <tr className="bg-black/[0.04] text-left dark:bg-white/[0.04]">
            <th className="px-3 py-2">Extension</th>
            <th className="px-3 py-2">Rating</th>
            <th className="px-3 py-2">Installs</th>
            <th className="px-3 py-2">Ratings</th>
            <th className="px-3 py-2">Screenshots</th>
            <th className="px-3 py-2">Desc. Length</th>
            <th className="px-3 py-2">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-black/10 dark:border-white/10">
            <td className="px-3 py-2 font-semibold">{data.extension.name} (You)</td>
            <td className="px-3 py-2">{asNumber(data.extension.rating)}</td>
            <td className="px-3 py-2">{data.extension.installs ?? 'N/A'}</td>
            <td className="px-3 py-2">{asNumber(data.extension.ratingCount)}</td>
            <td className="px-3 py-2">{asNumber(data.extension.screenshots.length)}</td>
            <td className="px-3 py-2">{asNumber(data.extension.description.length)}</td>
            <td className="px-3 py-2">{data.extension.lastUpdated ?? 'N/A'}</td>
          </tr>
          {competitors.map((competitor) => (
            <tr key={competitor.url} className="border-t border-black/10 dark:border-white/10">
              <td className="px-3 py-2">
                <a href={competitor.url} target="_blank" rel="noreferrer" className="text-ocean underline-offset-2 hover:underline">
                  {competitor.name}
                </a>
              </td>
              <td className="px-3 py-2">{asNumber(competitor.rating)}</td>
              <td className="px-3 py-2">{competitor.installs ?? 'N/A'}</td>
              <td className="px-3 py-2">{asNumber(competitor.ratingCount)}</td>
              <td className="px-3 py-2">{asNumber(competitor.screenshotCount)}</td>
              <td className="px-3 py-2">{asNumber(competitor.descriptionLength)}</td>
              <td className="px-3 py-2">{competitor.lastUpdated ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
