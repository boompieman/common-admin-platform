import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createUsage, listUsage, updateUsage } from "../api";
import { useAuth } from "../auth-context";
import { EmptyState, ErrorBanner, PageHeader } from "../components";
import type { UsageResource } from "../types";

export function UsagePage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<UsageResource[]>([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ key: "", label: "", current_value: 0, limit_value: 1000, unit: "items" });

  useEffect(() => {
    listUsage(session.token).then(setRows).catch((reason) => setError(reason.message));
  }, [session.token]);

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.current_value, 0), [rows]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const row = await createUsage(session.token, draft);
      setRows((current) => [...current, row]);
      setDraft({ key: "", label: "", current_value: 0, limit_value: 1000, unit: "items" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to add usage resource.");
    }
  }

  async function increment(row: UsageResource) {
    try {
      const next = await updateUsage(session.token, row.id, { current_value: row.current_value + 1 });
      setRows((current) => current.map((item) => item.id === row.id ? next : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update usage.");
    }
  }

  return (
    <>
      <PageHeader title="Usage management" description={`${total.toLocaleString()} total units across ${rows.length} tracked resources`} />
      <ErrorBanner error={error} />
      <form className="panel form-grid four" onSubmit={submit}>
        <label>Resource key<input required pattern="[a-z0-9-]+" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></label>
        <label>Label<input required value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></label>
        <label>Limit<input required type="number" min="1" value={draft.limit_value} onChange={(e) => setDraft({ ...draft, limit_value: Number(e.target.value) })} /></label>
        <label>Unit<input required value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></label>
        <div className="form-actions"><button className="primary">Track resource</button></div>
      </form>
      <section className="cards">
        {rows.length === 0 ? <EmptyState>No usage resources have been configured.</EmptyState> : rows.map((row) => (
          <article className="usage-card" key={row.id}>
            <div><span className="eyebrow">{row.key}</span><h2>{row.label}</h2></div>
            <strong className="metric">{row.current_value.toLocaleString()} <small>{row.unit}</small></strong>
            <div className="progress"><span style={{ width: `${row.percent_used ?? 0}%` }} /></div>
            <footer><span>{row.limit_value ? `${row.percent_used}% of ${row.limit_value.toLocaleString()}` : "No limit"}</span><button className="text-button" onClick={() => void increment(row)}>Add one</button></footer>
          </article>
        ))}
      </section>
    </>
  );
}
