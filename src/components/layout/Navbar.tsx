import Link from 'next/link';
import { ScrollText, Feather, Eye, LogOut, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/actions/post.actions';
import { WaxSeal } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; role: 'user' | 'admin' } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#6e552f] bg-[#0e0b09]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand Crest - shrink-0 & whitespace-nowrap prevents title wrapping */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <WaxSeal size={36} />
          <div className="whitespace-nowrap">
            <span className="font-display text-base sm:text-lg font-bold tracking-wider text-[#e8cf96] block">
              The Chronicler&apos;s Archive
            </span>
            <span className="text-[11px] tracking-widest uppercase text-[#9e8f77] hidden md:block">
              Guild Noticeboard &amp; Lore Ledger
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="font-display text-xs uppercase tracking-wider text-[#d4c3a3] hover:text-[#e8cf96] hover:bg-[#1c150e] px-2.5 py-1.5 border border-transparent hover:border-[#6e552f]/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <ScrollText className="w-4 h-4 text-[#c8aa6e]" />
            <span className="hidden sm:inline">Noticeboard</span>
          </Link>

          {user ? (
            <>
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="font-display text-xs uppercase tracking-wider text-[#d4c3a3] hover:text-[#e8cf96] hover:bg-[#1c150e] px-2.5 py-1.5 border border-transparent hover:border-[#6e552f]/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="System Audit Logs"
                >
                  <Eye className="w-4 h-4 text-[#c8aa6e]" />
                  <span className="hidden sm:inline">Audit Logs</span>
                </Link>
              )}

              <Link
                href="/create"
                className="font-display text-xs uppercase tracking-wider text-[#e8cf96] bg-[#2c2012] border border-[#c8aa6e] hover:bg-[#3d2c19] px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Feather className="w-3.5 h-3.5 text-[#e8cf96]" />
                <span>Scribe Scroll</span>
              </Link>

              <div className="hidden xl:flex items-center gap-2 pl-2.5 ml-1 border-l border-[#6e552f]/60 whitespace-nowrap">
                <span className="text-sm text-[#e8dcc4] max-w-[130px] truncate">
                  {profile?.username || user.email?.split('@')[0]}
                </span>
                <span className="font-display text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#6e552f] bg-[#1c1612] text-[#c8aa6e]">
                  {profile?.role === 'admin' ? 'Archivist' : 'Adventurer'}
                </span>
              </div>

              <form action={signOutAction}>
                <Button type="submit" variant="obsidian" size="sm" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="gold" size="sm">
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}