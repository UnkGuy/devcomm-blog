'use client';

import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function ReportIssuePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // We store issues directly into the audit_logs table to avoid needing new SQL migrations!
    const { error: dbError } = await supabase.from('audit_logs').insert({
      actor_id: user?.id || null,
      action: 'USER_REPORTED_ISSUE',
      table_name: 'system',
      record_id: 'feedback',
      metadata: { issue_title: title, issue_description: description }
    });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg3-panel p-8 sm:p-12 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-[#86efac] mx-auto" />
        <h2 className="font-display text-2xl font-bold text-[#e8cf96]">Missive Received</h2>
        <p className="text-[#d4c3a3]">
          Your report has been securely delivered to the Archivists. Thank you for helping keep Viggy&apos;s Archive clean and functional.
        </p>
        <button onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); }} className="text-xs font-display uppercase tracking-widest text-[#c8aa6e] hover:text-[#f3e5c8] underline mt-4 block mx-auto">
          Report another issue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-[#fca5a5] mx-auto" />
        <h1 className="font-display text-3xl font-bold text-[#f3e5c8]">Report an Issue</h1>
        <p className="text-[#9e8f77] text-sm">
          Did a mimic break a button? Let the Archivists know below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg3-panel p-6 sm:p-8 space-y-5">
        <div className="space-y-1.5">
          <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
            Issue Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Scroll Preview not updating"
            className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] focus:outline-none focus:border-[#c8aa6e]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
            Detailed Description *
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe what you were doing and what broke..."
            className="w-full px-3.5 py-3 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] focus:outline-none focus:border-[#c8aa6e] resize-y"
          />
        </div>

        {error && <p className="text-xs text-[#f87171]">{error}</p>}

        <div className="pt-2">
          <Button type="submit" variant="crimson" className="w-full" disabled={submitting}>
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Dispatching Raven...' : 'Submit Report'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
