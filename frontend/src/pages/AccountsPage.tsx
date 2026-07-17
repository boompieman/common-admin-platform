import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createAccount, listAccounts, updateAccount } from "../api";
import { useAuth } from "../auth-context";
import { EmptyState, ErrorBanner, PageHeader, Pill } from "../components";
import type { Account } from "../types";

type AccountDraft = Pick<Account, "name" | "email" | "department" | "role" | "status">;

const initialForm: AccountDraft = {
  name: "",
  email: "",
  department: "",
  role: "member" as const,
  status: "invited" as const,
};

export function AccountsPage() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listAccounts(session.token)
      .then(({ accounts: rows }) => setAccounts(rows))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [session.token]);

  const activeCount = useMemo(
    () => accounts.filter((account) => account.status === "active").length,
    [accounts],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const { account } = await createAccount(session.token, form);
      setAccounts((rows) => [account, ...rows]);
      setForm(initialForm);
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create account.");
    }
  }

  async function toggle(account: Account) {
    const status = account.status === "disabled" ? "active" : "disabled";
    try {
      const response = await updateAccount(session.token, account.id, { status });
      setAccounts((rows) => rows.map((row) => row.id === account.id ? response.account : row));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update account.");
    }
  }

  return (
    <>
      <PageHeader
        title="Account management"
        description={`${activeCount} active accounts out of ${accounts.length} total`}
        action={<button className="primary" onClick={() => setShowForm((value) => !value)}>Add account</button>}
      />
      <ErrorBanner error={error} />
      {showForm && (
        <form className="panel form-grid" onSubmit={submit}>
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Department<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
          <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "member" })}><option value="member">Member</option><option value="admin">Admin</option></select></label>
          <div className="form-actions"><button className="primary">Create</button><button type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>
      )}
      <section className="panel table-panel">
        {loading ? <EmptyState>Loading accounts…</EmptyState> : accounts.length === 0 ? <EmptyState>No accounts found.</EmptyState> : (
          <table>
            <thead><tr><th>Account</th><th>Department</th><th>Role</th><th>Status</th><th /></tr></thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.name}</strong><span className="cell-subtitle">{account.email}</span></td>
                  <td>{account.department || "—"}</td>
                  <td><Pill>{account.role}</Pill></td>
                  <td><Pill tone={account.status === "active" ? "good" : account.status === "invited" ? "warn" : "neutral"}>{account.status}</Pill></td>
                  <td className="right"><button className="text-button" onClick={() => void toggle(account)}>{account.status === "disabled" ? "Enable" : "Disable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
