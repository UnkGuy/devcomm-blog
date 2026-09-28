import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MarkdownEditor } from '@/components/post/MarkdownEditor';

export default async function CreatePostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Noticeboard</span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f3e5c8]">
            Scribe a New Scroll
          </h1>
        </div>
      </div>

      <MarkdownEditor />
    </div>
  );
}