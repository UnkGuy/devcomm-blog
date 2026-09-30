import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Activity, Database, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { AuditLog } from '@/types/database.types';
import { formatRelativeDate } from '@/lib/utils';
import { Badge, GoldDivider } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

const LOGS_PER_PAGE = 20;

interface AdminPageProps {
  searchParams: Promise<{
    q?: string;
    action?: string;
    table?: string;
    page?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const queryText = (params.q || '').trim().toLowerCase();
  const actionFilter = params.action || '';
  const tableFilter = params.table || '';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

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

  // Fetch audit logs with actor profile details
  let dbQuery = supabase
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
    .limit(500);

  if (actionFilter) {
    dbQuery = dbQuery.eq('action', actionFilter);
  }
  if (tableFilter) {
    dbQuery = dbQuery.eq('table_name', tableFilter);
  }

  const { data: rawLogs } = await dbQuery;
  const allLogs = (rawLogs as unknown as AuditLog[]) || [];

  // Filter by search text (matches username, record_id, table_name, action, or payload content)
  const filteredLogs = queryText
    ? allLogs.filter((log) => {
        const username = log.profiles?.username?.toLowerCase() || 'system';
        const recordId = log.record_id.toLowerCase();
        const tableName = log.table_name.toLowerCase();
        const action = log.action.toLowerCase();
        const payloadStr = JSON.stringify({
          n: log.new_data,
          o: log.old_data,
          m: log.metadata,
        }).toLowerCase();

        return (
          username.includes(queryText) ||
          recordId.includes(queryText) ||
          tableName.includes(queryText) ||
          action.includes(queryText) ||
          payloadStr.includes(queryText)
        );
      })
    : allLogs;

  // Paginate: strictly at most 20 logs per page
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * LOGS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);

  function buildPageHref(pageNum: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (actionFilter) sp.set('action', actionFilter);
    if (tableFilter) sp.set('table', tableFilter);
    sp.set('page', String(pageNum));
    return `/admin?${sp.toString()}`;
  }

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
        <Badge variant="admin">Archivist Access Verified</Badge>
      </div>

      <section className="bg3-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f3e5c8] flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-[#c8aa6e]" />
              <span>The Scrying Orb &bull; System Audit Logs</span>
            </h1>
            <p className="text-sm text-[#9e8f77] mt-1">
              Database trigger ledger recording user actions, content mutations, and authentication events (Max 20 per page).
            </p>
          </div>
          <div className="text-right font-mono text-xs text-[#c8aa6e]">
            {filteredLogs.length} matching log(s) &bull; Page {safePage} of {totalPages}
          </div>
        </div>

        <GoldDivider />

        {/* Admin Search & Filter Bar */}
        <form method="GET" action="/admin" className="grid grid-cols-1 sm:grid-cols-12 gap-3 my-5 bg-[#0b0908] p-3.5 border border-[#6e552f]/70">
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-[#c8aa6e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={params.q || ''}
              placeholder="Search by user, record ID, or payload..."
              className="w-full pl-9 pr-3 py-2 bg-[#14100d] border border-[#6e552f] text-xs sm:text-sm text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
  name="action"
  defaultValue={actionFilter}
  className="w-full px-3 py-2 bg-[#14100d] border border-[#6e552f] text-xs sm:text-sm text-[#f3e5c8] focus:outline-none focus:border-[#c8aa6e]"
>
  <option value="">All Actions</option>
  <option value="INSERT">INSERT</option>
  <option value="UPDATE">UPDATE</option>
  <option value="DELETE">DELETE</option>
  <option value="USER_LOGIN">USER_LOGIN</option>
  <option value="USER_SIGNUP">USER_SIGNUP</option>
  <option value="USER_LOGOUT">USER_LOGOUT</option>
  {/* Add this new option below */}
  <option value="USER_REPORTED_ISSUE">USER_REPORTED_ISSUE</option>
</select>
          </div>

          <div className="sm:col-span-2">
            <select
              name="table"
              defaultValue={tableFilter}
              className="w-full px-3 py-2 bg-[#14100d] border border-[#6e552f] text-xs sm:text-sm text-[#f3e5c8] focus:outline-none focus:border-[#c8aa6e]"
            >
              <option value="">All Tables</option>
              <option value="posts">posts</option>
              <option value="comments">comments</option>
              <option value="profiles">profiles</option>
              <option value="post_likes">post_likes</option>
              <option value="tags">tags</option>
              <option value="auth.session">auth.session</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-1.5">
            <Button type="submit" variant="gold" size="sm" className="w-full">
              Filter
            </Button>
            {(params.q || actionFilter || tableFilter) && (
              <Link
                href="/admin"
                className="font-display px-2.5 py-1.5 text-xs uppercase border border-[#6e552f] bg-[#14100d] text-[#9e8f77] hover:text-[#f3e5c8] flex items-center"
              >
                Reset
              </Link>
            )}
          </div>
        </form>

        {/* Paginated Audit Log Entries (Max 20 per page) */}
        <div className="mt-4 space-y-3">
          {paginatedLogs.length > 0 ? (
  paginatedLogs.map((log) => {
    const isDelete = log.action.includes('DELETE');
    const isInsert = log.action.includes('INSERT') || log.action.includes('SIGNUP');
    const isIssue = log.action === 'USER_REPORTED_ISSUE'; // Add this check

    return (
      <div
        key={log.id}
        className="bg-[#0b0908] border border-[#6e552f]/70 p-4 space-y-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 border ${
                isIssue
                  ? 'bg-[#422006] text-[#fdba74] border-[#f97316]' // Amber warning for issues
                  : isDelete
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

                  <div className="font-mono text-xs text-[#9e8f77] break-all">
                    Record ID: <span className="text-[#d4c3a3]">{log.record_id}</span>
                  </div>

                  {(log.new_data || log.old_data || log.metadata) && (
                    <details className="mt-2">
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
              No audit logs match your current filter criteria.
            </p>
          )}
        </div>

        {/* Numbered 1, 2, 3, 4 Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-8 flex-wrap">
            {safePage > 1 && (
              <Link
                href={buildPageHref(safePage - 1)}
                className="font-display px-3 py-1.5 text-xs uppercase tracking-wider border border-[#6e552f] bg-[#14100d] text-[#c8aa6e] hover:border-[#c8aa6e]"
              >
                Prev
              </Link>
            )}

            {pageNumbers.map((num) => (
              <Link
                key={num}
                href={buildPageHref(num)}
                className={`font-display min-w-[34px] h-[34px] px-2.5 text-xs font-bold border inline-flex items-center justify-center ${
                  num === safePage
                    ? 'bg-[#2c2012] text-[#fff3d1] border-[#c8aa6e] shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                    : 'bg-[#0b0908] text-[#9e8f77] border-[#4a3a24] hover:border-[#c8aa6e] hover:text-[#e8cf96]'
                }`}
              >
                {num}
              </Link>
            ))}

            {safePage < totalPages && (
              <Link
                href={buildPageHref(safePage + 1)}
                className="font-display px-3 py-1.5 text-xs uppercase tracking-wider border border-[#6e552f] bg-[#14100d] text-[#c8aa6e] hover:border-[#c8aa6e]"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}