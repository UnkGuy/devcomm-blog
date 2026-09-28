import Link from 'next/link';
import { ScrollText, Feather, ShieldAlert, LogOut, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/actions/post.actions';
import { Badge, WaxSeal } from '@/components/ui/Badge';
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <WaxSeal size={38} />
          <div>
            <span className="font-display text-lg font-bold tracking-wider text-[#e8cf96] block">
              The Chronicler&apos;s Archive
            </span>
            <span className="text-xs tracking-widest uppercase text-[#9e8f77] hidden sm:block">
              Guild Noticeboard &amp; Lore Ledger
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="font-display text-xs sm:text-sm uppercase tracking-wider text-[#d4c3a3] hover:text-[#e8cf96] px-2.5 py-1.5 flex items-center gap-1.5"
          >
            <ScrollText className="w-4 h-4 text-[#c8aa6e]" />
            <span className="hidden md:inline">Noticeboard</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/create"
                className="font-display text-xs sm:text-sm uppercase tracking-wider text-[#e8cf96] bg-[#2c2012] border border-[#c8aa6e] hover:bg-[#3d2c19] px-3 py-1.5 flex items-center gap-1.5"
              >
                <Feather className="w-4 h-4" />
                <span>Scribe Scroll</span>
              </Link>

              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="font-display text-xs sm:text-sm uppercase tracking-wider text-[#fecaca] bg-[#5c1313] border border-[#dc2626] hover:bg-[#751919] px-3 py-1.5 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden sm:inline">Audit Logs</span>
                </Link>
              )}

              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#6e552f]">
                <span className="text-sm text-[#e8dcc4]">
                  {profile?.username || user.email?.split('@')[0]}
                </span>
                <Badge variant={profile?.role === 'admin' ? 'admin' : 'user'}>
                  {profile?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
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