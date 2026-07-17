import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { fetchMe, login, logout, readSession, saveSession } from "./api";
import { AuthContext } from "./auth-context";
import type { AuthSession } from "./types";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const [checking, setChecking] = useState(Boolean(session));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    void fetchMe(token)
      .then(({ user }) => {
        const next = { token, user };
        saveSession(next);
        setSession(next);
      })
      .catch(() => {
        saveSession(null);
        setSession(null);
      })
      .finally(() => setChecking(false));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      setSession(await login(username.trim(), password));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return <div className="center-screen">Checking session…</div>;

  if (!session) {
    return (
      <main className="login-shell">
        <form className="login-card" onSubmit={submit}>
          <div className="brand-mark">CA</div>
          <p className="eyebrow">COMMON ADMIN PLATFORM</p>
          <h1>Sign in</h1>
          <p className="muted">Use a staff account created by the platform owner.</p>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button className="primary" disabled={submitting || !username.trim() || !password}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        signOut: async () => {
          try {
            await logout(session.token);
          } finally {
            setSession(null);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
