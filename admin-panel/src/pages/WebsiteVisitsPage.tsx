import { useEffect, useState } from 'react';
import { Download, Eye, Globe, Search, Users } from 'lucide-react';
import * as api from '../services/api';
import StatCard from '../components/StatCard';
import { downloadCsv } from '../utils/csv';
import type { WebsiteVisitRow, WebsiteVisitSourceRow, WebsiteVisitStats, WebsiteVisitTrendPoint } from '../types';

const SOURCE_LABELS: Record<string, string> = {
  search: 'Google / search',
  direct: 'Direct',
  social: 'Social',
  referral: 'Other site',
};

const SOURCE_STYLES: Record<string, string> = {
  search: 'bg-mint-bg text-mint-deep',
  direct: 'bg-ink-300 text-ink-900',
  social: 'bg-coral-bg text-coral-deep',
  referral: 'bg-amber-bg text-amber',
};

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function WebsiteVisitsPage() {
  const [stats, setStats] = useState<WebsiteVisitStats | null>(null);
  const [trend, setTrend] = useState<WebsiteVisitTrendPoint[]>([]);
  const [sources, setSources] = useState<WebsiteVisitSourceRow[]>([]);
  const [visits, setVisits] = useState<WebsiteVisitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getWebsiteVisits()
      .then((res) => {
        setStats(res.stats);
        setTrend(res.trend);
        setSources(res.sources);
        setVisits(res.visits);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, []);

  const maxUnique = Math.max(1, ...trend.map((t) => t.unique));
  const sourceTotal = sources.reduce((sum, s) => sum + s.views, 0) || 1;

  const exportCsv = () => {
    downloadCsv(
      'website_visits.csv',
      ['When', 'Source', 'Referrer', 'Page', 'Campaign'],
      visits.map((v) => [
        fmtWhen(v.visited_at),
        SOURCE_LABELS[v.source] ?? v.source,
        v.referrer ?? '',
        v.path ?? '/',
        v.utm_source ?? '',
      ]),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Website visits</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Who opened mharidhani.com — unique people and page views</p>
        </div>
        {visits.length > 0 && (
          <button onClick={exportCsv} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] border border-line font-bold text-xs text-ink-900">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="People today" value={stats.todayUnique} icon={Users} color="var(--color-terra)" />
          <StatCard label="Views today" value={stats.todayViews} icon={Eye} color="var(--color-mint)" />
          <StatCard label="People this week" value={stats.weekUnique} icon={Globe} color="var(--color-amber)" />
          <StatCard label="People this month" value={stats.monthUnique} icon={Search} color="var(--color-coral)" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-paper border border-line rounded-2xl p-5">
          <div className="font-extrabold text-[13px] text-ink-900 mb-3.5">Unique visitors — last 30 days</div>
          {trend.length === 0 ? (
            <p className="text-xs text-ink-600">No visits yet. Open the public website once to start the record.</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {trend.map((t) => (
                <div
                  key={t.date}
                  title={`${t.date}: ${t.unique} people, ${t.views} views`}
                  className="flex-1 rounded-t-[5px] bg-gradient-to-b from-[#3B3849] to-terra min-h-[4px]"
                  style={{ height: `${Math.max(4, (t.unique / maxUnique) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-paper border border-line rounded-2xl p-5">
          <div className="font-extrabold text-[13px] text-ink-900 mb-3.5">How they found the site</div>
          {sources.length === 0 ? (
            <p className="text-xs text-ink-600">No sources yet.</p>
          ) : (
            <ul className="space-y-3">
              {sources.map((s) => (
                <li key={s.source}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{SOURCE_LABELS[s.source] ?? s.source}</span>
                    <span className="text-ink-600">{s.unique_visitors} people</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-ink-300 overflow-hidden">
                    <div className="h-full bg-terra rounded-full" style={{ width: `${Math.max(4, (s.views / sourceTotal) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {stats && (
        <p className="text-[11px] text-ink-600 font-semibold">
          All time: {stats.allUnique} people · {stats.allViews} page views
        </p>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : visits.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 text-center">No website visits recorded yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">When</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Source</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Came from</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Page</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-b border-paper">
                  <td className="p-3 font-semibold text-ink-900 whitespace-nowrap">{fmtWhen(v.visited_at)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${SOURCE_STYLES[v.source] ?? 'bg-ink-300 text-ink-600'}`}>
                      {SOURCE_LABELS[v.source] ?? v.source}
                    </span>
                  </td>
                  <td className="p-3 text-ink-600">{v.referrer || '—'}</td>
                  <td className="p-3 text-ink-600">{v.path || '/'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
