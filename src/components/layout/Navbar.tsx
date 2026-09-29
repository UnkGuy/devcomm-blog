import Link from 'next/link';
import { ScrollText, Feather, Eye, LogOut, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/actions/post.actions';
import { WaxSeal } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProfileModal } from './ProfileModal';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    username: string;
    bio: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, bio, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#6e552f] bg-[#0e0b09]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <WaxSeal size={36} />
          <div className="whitespace-nowrap">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#e8cf96] block">
              Viggy&apos;s Archive
            </span>
            <span className="text-[11px] tracking-widest uppercase text-[#9e8f77] hidden md:block">
              D&amp;D Guild Noticeboard &amp; Lore Ledger
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
  href={`/scribe/${encodeURIComponent(
    profile?.username || user.email?.split('@')[0] || 'Adventurer'
  )}`}
  className="font-display text-xs uppercase tracking-wider text-[#d4c3a3] hover:text-[#e8cf96] hover:bg-[#1c150e] px-2.5 py-1.5 border border-transparent hover:border-[#6e552f]/60 transition-colors hidden sm:flex items-center gap-1.5 whitespace-nowrap"
  title="View Your Personal Noticeboard & Scroll History"
>
  <span>My Ledger</span>
</Link>


              <Link
                href="/create"
                className="font-display text-xs uppercase tracking-wider text-[#e8cf96] bg-[#2c2012] border border-[#c8aa6e] hover:bg-[#3d2c19] px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Feather className="w-3.5 h-3.5 text-[#e8cf96]" />
                <span>Scribe Scroll</span>
              </Link>

              {/* In-Place Profile Editor Modal Trigger */}
              <ProfileModal
                userId={user.id}
                initialUsername={profile?.username || user.email?.split('@')[0] || 'Adventurer'}
                initialBio={profile?.bio || null}
                initialAvatarUrl={profile?.avatar_url || null}
                role={profile?.role || 'user'}
              />

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