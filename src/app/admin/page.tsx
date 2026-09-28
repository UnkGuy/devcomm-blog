import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Activity, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { AuditLog } from '@/types/database.types';
import { formatRelativeDate } from '@/lib/utils';
import { Badge, GoldDivider } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  const { data: rawLogs } = await supabase
    .from('audit_logs')
    .select(
      `
      *,
      profiles:actor_id (
        id,
        username,
        role,
        avatar_url
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = (rawLogs as unknown as AuditLog[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Noticeboard</span>
        </Link>
        <Badge variant="admin">Admin Access Verified</Badge>
      </div>

      <section className="bg3-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f3e5c8] flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-[#f87171]" />
              <span>The Scrying Orb &bull; System Audit Logs</span>
            </h1>
            <p className="text-sm text-[#9e8f77] mt-1">
              Real-time database trigger ledger recording every user action, content mutation, and authentication event.
            </p>
          </div>
          <div className="text-right font-mono text-xs text-[#c8aa6e]">
            Showing latest {logs.length} events
          </div>
        </div>

        <GoldDivider />

        <div className="mt-6 space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => {
              const isDelete = log.action.includes('DELETE');
              const isInsert =
                log.action.includes('INSERT') || log.action.includes('SIGNUP');

              return (
                <div
                  key={log.id}
                  className="bg-[#0b0908] border border-[#6e552f]/70 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 border ${
                          isDelete
                            ? 'bg-[#450a0a] text-[#fca5a5] border-[#dc2626]'
                            : isInsert
                            ? 'bg-[#142615] text-[#bbf7d0] border-[#22c55e]'
                            : 'bg-[#2c2012] text-[#fde68a] border-[#c8aa6e]'
                        }`}
                      >
                        {log.action}
                      </span>

                      <span className="font-mono text-xs text-[#c8aa6e] inline-flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" />
                        {log.table_name}
                      </span>

                      <span className="text-sm text-[#e8dcc4]">
                        by{' '}
                        <strong className="text-[#e8cf96]">
                          {log.profiles?.username || 'System / Guest'}
                        </strong>
                      </span>
                    </div>

                    <span className="font-mono text-xs text-[#8c7b65] inline-flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {formatRelativeDate(log.created_at)}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-[#9e8f77]">
                    Record ID: <span className="text-[#d4c3a3]">{log.record_id}</span>
                  </div>

                  {/* Expandable JSON Payload */}
                  {(log.new_data || log.old_data || log.metadata) && (
                    <details className="mt-2 group">
                      <summary className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] cursor-pointer hover:text-[#fff3d1]">
                        Inspect Event Payload (JSON)
                      </summary>
                      <pre className="mt-2 p-3 bg-[#14100d] border border-[#4a3a24] text-[11px] text-[#e8dcc4] overflow-x-auto">
                        {JSON.stringify(
                          {
                            old_data: log.old_data,
                            new_data: log.new_data,
                            metadata: log.metadata,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center py-8 text-sm text-[#8c7b65]">
              No audit logs recorded yet. Perform an action in the app to see it logged here!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}