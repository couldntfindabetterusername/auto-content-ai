import { useState } from 'react';
import type { SeoKeyword } from '../types/calendar';

interface ThumbnailShape {
  text_overlay: string;
  visual_elements: string[];
  color_direction: string;
}

function asThumbnail(v: unknown): ThumbnailShape | null {
  if (!v || typeof v !== 'object') return null;
  const t = v as Record<string, unknown>;
  if (typeof t.text_overlay !== 'string') return null;
  return {
    text_overlay: t.text_overlay,
    visual_elements: Array.isArray(t.visual_elements) ? (t.visual_elements as string[]) : [],
    color_direction: typeof t.color_direction === 'string' ? t.color_direction : '',
  };
}

interface Props {
  seoDescription: string | null;
  seoKeywords: SeoKeyword[];
  thumbnailJson: unknown;
  regenButton?: React.ReactNode;
}

export function SeoPackagePanel({ seoDescription, seoKeywords, thumbnailJson, regenButton }: Props) {
  const [open, setOpen] = useState(false);

  const tags = seoKeywords.filter((k) => k.keyword_type === 'tag');
  const primary = seoKeywords.filter((k) => k.keyword_type === 'primary');
  const longTail = seoKeywords.filter((k) => k.keyword_type === 'long_tail');
  const thumbnail = asThumbnail(thumbnailJson);

  const hasContent = seoDescription || tags.length > 0 || primary.length > 0 || longTail.length > 0 || thumbnail;
  if (!hasContent) return null;

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex-1 text-left"
        >
          <span>{open ? '▾' : '▸'}</span>
          SEO Package
        </button>
        {regenButton}
      </div>

      {open && (
        <div className="mt-3 space-y-4">
          {seoDescription && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{seoDescription}</p>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-block px-2 py-0.5 bg-violet-100 text-violet-800 border border-violet-200 text-xs rounded"
                  >
                    {t.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {primary.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Primary keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {primary.map((k) => (
                  <span
                    key={k.id}
                    className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-xs rounded"
                  >
                    {k.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {longTail.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Long-tail keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {longTail.map((k) => (
                  <span
                    key={k.id}
                    className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs rounded"
                  >
                    {k.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {thumbnail && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Thumbnail</p>
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                {thumbnail.text_overlay && (
                  <p className="text-gray-800">
                    <span className="font-medium">Text: </span>
                    {thumbnail.text_overlay}
                  </p>
                )}
                {thumbnail.color_direction && (
                  <p className="text-gray-700">
                    <span className="font-medium">Colors: </span>
                    {thumbnail.color_direction}
                  </p>
                )}
                {thumbnail.visual_elements.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {thumbnail.visual_elements.map((el, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-gray-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                        {el}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
