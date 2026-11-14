import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Empty, ErrorBox, NoApp, PageHeader, RangePicker } from "../components/ui";
import { api } from "../lib/api";
import { useApps } from "../lib/appContext";
import { ms, num } from "../lib/format";
import type { EndpointStat } from "../lib/types";

type SortKey = "requests" | "avg" | "p95" | "errorRate";

export default function ApiMonitoring() {
  const { current, range } = useApps();
  const id = current?._id;
  const [sort, setSort] = useState<SortKey>("requests");
  const [filter, setFilter] = useState("");

  const { data, error, isLoading } = useQuery({
    queryKey: ["app", id, "endpoints", range],
    queryFn: () => api<EndpointStat[]>(`/apps/${id}/metrics/endpoints?range=${range}`),
    enabled: !!id,
  });

  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((r) => `${r.method} ${r.path}`.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => b[sort] - a[sort]),
    [data, sort, filter]
  );

  if (!current) return <NoApp />;
  if (error) return <ErrorBox error={error} />;

  const SortTh = ({ k, children }: { k: SortKey; children: string }) => (
    <th className="th cursor-pointer select-none hover:text-white" onClick={() => setSort(k)}>
      {children} {sort === k && "↓"}
    </th>
  );

  return (
    <>
      <PageHeader title="API Monitoring" subtitle="Per-endpoint performance (failed = HTTP 5xx)" right={<RangePicker />} />
      <input className="input mb-3 max-w-sm" placeholder="Filter endpoints…" value={filter} onChange={(e) => setFilter(e.target.value)} />

      {isLoading ? <div className="text-muted">Loading…</div> : !rows.length ? (
        <Empty>No endpoint data in this range.</Empty>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Endpoint</th>
                <SortTh k="requests">Requests</SortTh>
                <SortTh k="avg">Avg</SortTh>
                <th className="th">P50</th>
                <SortTh k="p95">P95</SortTh>
                <th className="th">P99</th>
                <th className="th">OK / Failed</th>
                <SortTh k="errorRate">Error %</SortTh>
                <th className="th">2xx / 3xx / 4xx / 5xx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.method + r.path} className="border-b border-line/60 last:border-0 hover:bg-panel2">
                  <td className="td font-mono text-xs"><span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-accent">{r.method}</span>{r.path}</td>
                  <td className="td">{num(r.requests)}</td>
                  <td className="td">{ms(r.avg)}</td>
                  <td className="td">{ms(r.p50)}</td>
                  <td className="td">{ms(r.p95)}</td>
                  <td className="td">{ms(r.p99)}</td>
                  <td className="td">{num(r.success)} / <span className={r.failed ? "text-bad" : ""}>{num(r.failed)}</span></td>
                  <td className={`td ${r.errorRate >= 5 ? "text-bad" : r.errorRate >= 1 ? "text-warn" : ""}`}>{r.errorRate}%</td>
                  <td className="td font-mono text-xs text-muted">{r.s2xx} / {r.s3xx} / {r.s4xx} / {r.s5xx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}