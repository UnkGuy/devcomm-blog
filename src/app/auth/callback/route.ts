import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await supabase.from('audit_logs').insert({
        actor_id: data.user.id,
        action: 'AUTH_CALLBACK_LOGIN',
        table_name: 'auth.users',
        record_id: data.user.id,
        metadata: { email: data.user.email, method: 'oauth_or_magic_link' },
      });
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate`);
}