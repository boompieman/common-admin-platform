import { type FormEvent, useEffect, useState } from "react";
import { createApi, listApis, updateApi } from "../api";
import { useAuth } from "../auth-context";
import { EmptyState, ErrorBanner, PageHeader, Pill } from "../components";
import type { ApiService } from "../types";

export function ApisPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<ApiService[]>([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", base_url: "", openapi_url: "", description: "", enabled: true });

  useEffect(() => {
    listApis(session.token).then(setRows).catch((reason) => setError(reason.message));
  }, [session.token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const row = await createApi(session.token, draft);
      setRows((current) => [...current, row]);
      setDraft({ name: "", base_url: "", openapi_url: "", description: "", enabled: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to register API.");
    }
  }

  async function toggle(row: ApiService) {
    try {
      const next = await updateApi(session.token, row.id, { enabled: !row.enabled });
      setRows((current) => current.map((item) => item.id === row.id ? next : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update API.");
    }
  }

  return (
    <>
      <PageHeader title="API registry" description="Product-neutral service catalog; registered URLs are never fetched by this server" />
      <ErrorBanner error={error} />
      <form className="panel form-grid" onSubmit={submit}>
        <label>Name<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Base URL<input required type="url" placeholder="https://api.example.test" value={draft.base_url} onChange={(e) => setDraft({ ...draft, base_url: e.target.value })} /></label>
        <label>OpenAPI URL<input type="url" placeholder="https://api.example.test/openapi.json" value={draft.openapi_url} onChange={(e) => setDraft({ ...draft, openapi_url: e.target.value })} /></label>
        <label>Description<input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <div className="form-actions"><button className="primary">Register API</button></div>
      </form>
      <section className="panel table-panel">
        {rows.length === 0 ? <EmptyState>No APIs have been registered.</EmptyState> : (
          <table>
            <thead><tr><th>Service</th><th>Base URL</th><th>OpenAPI</th><th>Status</th><th /></tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.name}</strong><span className="cell-subtitle">{row.description}</span></td>
                <td><a href={row.base_url} target="_blank" rel="noreferrer">{row.base_url}</a></td>
                <td>{row.openapi_url ? <a href={row.openapi_url} target="_blank" rel="noreferrer">Schema</a> : "—"}</td>
                <td><Pill tone={row.enabled ? "good" : "neutral"}>{row.enabled ? "enabled" : "disabled"}</Pill></td>
                <td className="right"><button className="text-button" onClick={() => void toggle(row)}>{row.enabled ? "Disable" : "Enable"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
