import { createContext, useContext } from "react";
import type { AuthSession } from "./types";

export type AuthValue = {
  session: AuthSession;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthGate");
  return value;
}
