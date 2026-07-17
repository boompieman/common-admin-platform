import { type FormEvent, useEffect, useState } from "react";
import { createPermission, listPermissions, updatePermission } from "../api";
import { useAuth } from "../auth-context";
import { EmptyState, ErrorBanner, PageHeader } from "../components";
import type { Permission } from "../types";

export function PermissionsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Permission[]>([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ key: "", label: "", description: "" });

  useEffect(() => {
    listPermissions(session.token).then(setRows).catch((reason) => setError(reason.message));
  }, [session.token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const row = await createPermission(session.token, {
        ...draft,
        admin_visible: true,
        member_visible: false,
      });
      setRows((current) => [...current, row]);
      setDraft({ key: "", label: "", description: "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create permission.");
    }
  }

  async function toggle(row: Permission, field: "admin_visible" | "member_visible") {
    try {
      const next = await updatePermission(session.token, row.id, { [field]: !row[field] });
      setRows((current) => current.map((item) => item.id === row.id ? next : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update permission.");
    }
  }

  return (
    <>
      <PageHeader title="Permission management" description="Persisted page and feature visibility for platform roles" />
      <ErrorBanner error={error} />
      <form className="panel form-grid three" onSubmit={submit}>
        <label>Feature key<input required pattern="[a-z0-9-]+" placeholder="reports" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></label>
        <label>Label<input required placeholder="Reports" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></label>
        <label>Description<input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <div className="form-actions"><button className="primary">Add permission</button></div>
      </form>
      <section className="panel table-panel">
        {rows.length === 0 ? <EmptyState>No permissions have been configured.</EmptyState> : (
          <table>
            <thead><tr><th>Feature</th><th>Description</th><th className="center">Admin</th><th className="center">Member</th></tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.label}</strong><span className="cell-subtitle">{row.key}</span></td>
                <td>{row.description || "—"}</td>
                <td className="center"><input type="checkbox" checked={row.admin_visible} onChange={() => void toggle(row, "admin_visible")} /></td>
                <td className="center"><input type="checkbox" checked={row.member_visible} onChange={() => void toggle(row, "member_visible")} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
