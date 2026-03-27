import React, { useState, useEffect } from 'react';
import { SitePage } from '../types';
import { fetchSitePage } from '../lib/supabase';

interface SitePageViewProps {
  slug: string;
  onBack: () => void;
}

const SitePageView: React.FC<SitePageViewProps> = ({ slug, onBack }) => {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSitePage(slug).then(data => {
      setPage(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  if (!page) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-black text-gray-400">পেজটি পাওয়া যায়নি</h2>
      <button onClick={onBack} className="mt-6 text-green-700 font-bold hover:underline">← হোমে যান</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 pb-32 animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-8">
        <button onClick={onBack} className="hover:text-green-700 transition">হোম</button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">{page.title}</span>
      </nav>

      {/* Page Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 px-8 py-10 md:px-12">
          <div className="inline-block bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {page.page_type === 'policy' ? 'পলিসি' : 'তথ্য'}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white">{page.title}</h1>
        </div>

        {/* Content */}
        <div
          className="px-8 py-10 md:px-12 prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-8 flex items-center gap-2 text-green-700 font-bold hover:underline text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
        হোমে ফিরে যান
      </button>
    </div>
  );
};

export default SitePageView;
