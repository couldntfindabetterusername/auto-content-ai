import { useEffect, useState } from 'react';
import type { VideoConcept } from '../types/calendar';
import { getCalendar } from '../api/contentCalendarClient';
import { CopyButton } from './CopyButton';
import { SeoPackagePanel } from './SeoPackagePanel';
import { RegenerateSectionButton } from './RegenerateSectionButton';

interface OutlineSection {
  timestamp: string;
  section: string;
  talking_points: string[];
  visuals: string[];
  retention_purpose: string;
}

interface RetentionHook {
  timestamp: string;
  line: string;
  reason: string;
}

interface Cta {
  primary: string;
  secondary: string;
}

function asOutline(v: unknown): OutlineSection[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (s): s is OutlineSection =>
      s !== null && typeof s === 'object' && typeof (s as Record<string, unknown>).section === 'string',
  );
}

function asRetentionHooks(v: unknown): RetentionHook[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is RetentionHook =>
      r !== null && typeof r === 'object' && typeof (r as Record<string, unknown>).line === 'string',
  );
}

function asCta(v: unknown): Cta | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  if (typeof c.primary !== 'string' || typeof c.secondary !== 'string') return null;
  return { primary: c.primary, secondary: c.secondary };
}

function CollapsibleSection({
  label,
  children,
  actions,
}: {
  label: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex-1 text-left"
        >
          <span>{open ? '▾' : '▸'}</span>
          {label}
        </button>
        {actions}
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface Props {
  concept: VideoConcept;
}

function buildConceptText(concept: VideoConcept): string {
  const outline = asOutline(concept.outline_json);
  const hooks = asRetentionHooks(concept.retention_tactics);
  const cta = asCta(concept.cta_json);
  const lines: string[] = [
    concept.recommended_title ?? concept.topic,
    '',
    concept.hook ?? '',
    '',
    'Outline:',
    ...outline.map((s) => `${s.timestamp} ${s.section}\n${s.talking_points.map((p) => `  - ${p}`).join('\n')}`),
    '',
    'Retention hooks:',
    ...hooks.map((h) => `${h.timestamp} "${h.line}"`),
    '',
    cta ? `CTA: ${cta.primary}` : '',
  ];
  return lines.join('\n').trim();
}

export function VideoConceptCard({ concept }: Props) {
  const [currentConcept, setCurrentConcept] = useState(concept);

  useEffect(() => {
    setCurrentConcept(concept);
  }, [concept.id]);

  const calendarId = currentConcept.calendar_id;
  const videoIndex = currentConcept.position - 1;

  async function refreshConcept() {
    if (!calendarId || calendarId === 'mock') return;
    try {
      const fresh = await getCalendar(calendarId);
      const freshConcept = fresh.videoConcepts.find((c) => c.id === currentConcept.id);
      if (freshConcept) setCurrentConcept(freshConcept);
    } catch {
      // ignore — stale data is acceptable on refresh failure
    }
  }

  const outline = asOutline(currentConcept.outline_json);
  const retentionHooks = asRetentionHooks(currentConcept.retention_tactics);
  const cta = asCta(currentConcept.cta_json);

  const recommendedTitle = currentConcept.titleOptions.find((t) => t.is_recommended);
  const otherTitles = currentConcept.titleOptions.filter((t) => !t.is_recommended);

  return (
    <div className="p-6 border rounded-xl bg-white space-y-4 text-left">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold flex items-center justify-center">
          {currentConcept.position}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-semibold text-gray-900 leading-snug flex-1">
              {currentConcept.recommended_title ?? currentConcept.topic}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <RegenerateSectionButton
                calendarId={calendarId}
                videoIndex={videoIndex}
                section="full_concept"
                onSuccess={refreshConcept}
              />
              <CopyButton text={buildConceptText(currentConcept)} label="Copy full concept" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{currentConcept.topic}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {currentConcept.content_type && (
              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-medium rounded">
                {currentConcept.content_type}
              </span>
            )}
            {currentConcept.confidence_score && (
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${
                  Number(currentConcept.confidence_score) >= 0.7
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : Number(currentConcept.confidence_score) >= 0.4
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {Math.round(Number(currentConcept.confidence_score) * 100)}% confidence
              </span>
            )}
          </div>
        </div>
      </div>

      {currentConcept.hook && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-amber-700">Hook</p>
            <div className="flex items-center gap-1">
              <RegenerateSectionButton
                calendarId={calendarId}
                videoIndex={videoIndex}
                section="hook"
                onSuccess={refreshConcept}
              />
              <CopyButton text={currentConcept.hook} label="Copy hook" />
            </div>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed">{currentConcept.hook}</p>
        </div>
      )}

      {currentConcept.goal && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Goal</p>
          <p className="text-sm text-gray-700">{currentConcept.goal}</p>
        </div>
      )}

      {currentConcept.titleOptions.length > 0 && (
        <CollapsibleSection
          label={`Title options (${currentConcept.titleOptions.length})`}
          actions={
            <RegenerateSectionButton
              calendarId={calendarId}
              videoIndex={videoIndex}
              section="titles"
              onSuccess={refreshConcept}
            />
          }
        >
          <div className="space-y-3">
            {recommendedTitle && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-green-900 flex-1">{recommendedTitle.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CopyButton text={recommendedTitle.title} label="Copy title" />
                    <span className="px-1.5 py-0.5 bg-green-200 text-green-800 text-xs rounded">recommended</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-green-700">
                  {recommendedTitle.seo_score && <span>SEO {recommendedTitle.seo_score}/10</span>}
                  {recommendedTitle.ctr_score && <span>CTR {recommendedTitle.ctr_score}/10</span>}
                </div>
                {recommendedTitle.rationale && (
                  <p className="text-xs text-green-700 mt-1">{recommendedTitle.rationale}</p>
                )}
              </div>
            )}
            {otherTitles.map((t) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 flex-1">{t.title}</p>
                  <CopyButton text={t.title} label="Copy title" />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  {t.seo_score && <span>SEO {t.seo_score}/10</span>}
                  {t.ctr_score && <span>CTR {t.ctr_score}/10</span>}
                </div>
                {t.rationale && <p className="text-xs text-gray-500 mt-1">{t.rationale}</p>}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {outline.length > 0 && (
        <CollapsibleSection
          label={`Outline (${outline.length} sections)`}
          actions={
            <RegenerateSectionButton
              calendarId={calendarId}
              videoIndex={videoIndex}
              section="outline"
              onSuccess={refreshConcept}
            />
          }
        >
          <div className="space-y-3">
            {outline.map((section, i) => (
              <div key={`${section.timestamp}-${i}`} className="pl-3 border-l-2 border-gray-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 shrink-0">{section.timestamp}</span>
                  <p className="text-sm font-medium text-gray-800 flex-1">{section.section}</p>
                  <CopyButton
                    text={[section.section, ...section.talking_points].join('\n')}
                    label="Copy section"
                  />
                </div>
                {section.talking_points.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {section.talking_points.map((point, j) => (
                      <li key={`${section.timestamp}-tp-${j}`} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                {section.retention_purpose && (
                  <p className="text-xs text-gray-400 italic mt-1">{section.retention_purpose}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {retentionHooks.length > 0 && (
        <CollapsibleSection label={`Retention hooks (${retentionHooks.length})`}>
          <div className="space-y-2">
            {retentionHooks.map((hook, i) => (
              <div key={`${hook.timestamp}-${i}`} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-400 shrink-0 pt-0.5">{hook.timestamp}</span>
                  <p className="text-sm text-blue-900 font-medium flex-1">{hook.line}</p>
                  <CopyButton text={hook.line} label="Copy hook" />
                </div>
                {hook.reason && <p className="text-xs text-blue-600 mt-1">{hook.reason}</p>}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {cta && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Call to action</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-xs font-medium text-gray-400 w-16 pt-0.5">Primary</span>
              <p className="text-sm text-gray-800">{cta.primary}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-xs font-medium text-gray-400 w-16 pt-0.5">Secondary</span>
              <p className="text-sm text-gray-700">{cta.secondary}</p>
            </div>
          </div>
        </div>
      )}

      <SeoPackagePanel
        seoDescription={currentConcept.seo_description}
        seoKeywords={currentConcept.seoKeywords}
        thumbnailJson={currentConcept.thumbnail_json}
        regenButton={
          <RegenerateSectionButton
            calendarId={calendarId}
            videoIndex={videoIndex}
            section="seo"
            onSuccess={refreshConcept}
          />
        }
      />
    </div>
  );
}
