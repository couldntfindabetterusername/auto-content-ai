import type { CalendarResponse } from '../types/calendar';

interface Props {
  calendar: CalendarResponse;
}

export function CalendarSummaryCard({ calendar }: Props) {
  const { strategySummary, channelAnalysis, trendAnalysis, videoConcepts } = calendar;

  return (
    <div className="space-y-6 text-left">
      {strategySummary && (
        <div className="p-6 border rounded-xl bg-white text-left">
          <p className="text-base font-semibold text-gray-900 mb-3">Strategy Summary</p>
          <p className="text-gray-700 leading-relaxed text-sm">{strategySummary}</p>
        </div>
      )}

      {channelAnalysis && (
        <div className="p-6 border rounded-xl bg-white text-left">
          <p className="text-base font-semibold text-gray-900 mb-3">Channel Analysis</p>
          {channelAnalysis.summary && (
            <p className="text-gray-700 text-sm mb-4">{channelAnalysis.summary}</p>
          )}
          {channelAnalysis.recommended_content_traits && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Recommended traits</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300">
                  {channelAnalysis.recommended_content_traits.ideal_length_minutes} min
                </span>
                <span className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300">
                  {channelAnalysis.recommended_content_traits.tone}
                </span>
                {channelAnalysis.recommended_content_traits.formats.map((f) => (
                  <span key={f} className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300">{f}</span>
                ))}
              </div>
            </div>
          )}
          {channelAnalysis.audience_inferences && channelAnalysis.audience_inferences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Audience insights</p>
              <ul className="space-y-1">
                {channelAnalysis.audience_inferences.map((inference, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {inference}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {trendAnalysis && trendAnalysis.trend_candidates && trendAnalysis.trend_candidates.length > 0 && (
        <div className="p-6 border rounded-xl bg-white text-left">
          <p className="text-base font-semibold text-gray-900 mb-3">Trend Research</p>
          <div className="space-y-3">
            {trendAnalysis.trend_candidates.slice(0, 3).map((candidate, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{candidate.topic}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{candidate.rationale}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${
                    candidate.trend_type === 'rising'
                      ? 'bg-green-200 text-green-900 border-green-300'
                      : candidate.trend_type === 'stable'
                        ? 'bg-yellow-200 text-yellow-900 border-yellow-300'
                        : 'bg-blue-200 text-blue-900 border-blue-300'
                  }`}>
                    {candidate.trend_type}
                  </span>
                  <span className="text-xs text-gray-500">{candidate.opportunity_score}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videoConcepts && videoConcepts.length > 0 && (
        <div className="p-6 border rounded-xl bg-white text-left">
          <p className="text-base font-semibold text-gray-900 mb-4">Content Mix</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">Topic</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">Goal</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {videoConcepts.map((concept) => (
                  <tr key={concept.id}>
                    <td className="py-3 pr-4 text-gray-400 text-sm">{concept.position}</td>
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="truncate text-gray-900 font-medium text-sm">{concept.topic}</p>
                      {concept.recommended_title && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{concept.recommended_title}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {concept.content_type ? (
                        <span className="inline-block px-2 py-0.5 bg-purple-200 text-purple-900 border border-purple-300 text-xs font-medium rounded">
                          {concept.content_type}
                        </span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs max-w-xs">
                      {concept.goal
                        ? <p className="line-clamp-2">{concept.goal}</p>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3">
                      {concept.confidence_score ? (
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${
                          Number(concept.confidence_score) >= 0.7
                            ? 'bg-green-200 text-green-900 border-green-300'
                            : Number(concept.confidence_score) >= 0.4
                              ? 'bg-yellow-200 text-yellow-900 border-yellow-300'
                              : 'bg-red-200 text-red-900 border-red-300'
                        }`}>
                          {Math.round(Number(concept.confidence_score) * 100)}%
                        </span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
