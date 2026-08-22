import React, { useEffect, useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { PageContent } from '../types/ysp';

const DEFAULT_CONTENT = `Article 1: Preamble & Name
The Youth Senate of Pakistan is established as a non-partisan, independent youth parliamentary platform to foster democratic awareness, parliamentary procedure, and civic leadership across all provinces and territories of Pakistan.

Article 2: Rules of Conduct & Etiquette
All Youth Senators and delegates shall maintain parliamentary dignity, decorum, and respectful speech during all sittings, committee meetings, and public forums.

Article 3: Standing Committee Governance
Standing committees are empowered to examine policy matters, conduct consultations, and submit formal youth recommendations to the Youth Senate Secretariat.`;

export const ConstitutionView: React.FC = () => {
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const pages = await fetchApi<PageContent[]>('/pages');
        const found = pages?.find(p => p.id === 'constitution' || p.slug === 'constitution');
        if (found) setPage(found);
      } catch (e) {
        console.warn('Failed to load Constitution page content', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const title = page?.title || 'Constitution & Rules of Procedure';
  const subtitle = page?.subtitle || 'Rules of order, code of conduct, committee regulations, and parliamentary ethics governing Youth Senate of Pakistan.';
  const body = page?.content || DEFAULT_CONTENT;
  const downloadUrl = page?.heroImage;

  // Each blank-line-separated block is treated as an Article; the first
  // line of the block is used as its heading if it looks like a title.
  const blocks = body.split(/\n\s*\n/).filter(b => b.trim());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 text-xs">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      <div className="bg-emerald-950 text-white rounded-2xl p-8 border-b-4 border-amber-500 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Governing Charter</span>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="text-xs text-emerald-100 max-w-xl">{subtitle}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        {blocks.map((block, idx) => {
          const lines = block.split('\n');
          const firstLine = lines[0].trim();
          const looksLikeHeading = firstLine.length < 90 && (lines.length > 1);
          const heading = looksLikeHeading ? firstLine : null;
          const paragraph = looksLikeHeading ? lines.slice(1).join(' ') : block;

          return (
            <section key={idx} className="space-y-2">
              {heading && (
                <h3 className="text-sm font-bold text-slate-900 uppercase border-b pb-1">{heading}</h3>
              )}
              <p className="whitespace-pre-wrap">{paragraph}</p>
            </section>
          );
        })}

        {downloadUrl && (
          <div className="pt-4 flex gap-4">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-xs uppercase flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Full Constitution PDF</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
