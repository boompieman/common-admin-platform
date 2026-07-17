export type AuthUser = {
  id: number;
  username: string;
  email: string;
  name: string;
  is_staff: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type Account = {
  id: number;
  username: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "member";
  status: "active" | "invited" | "disabled";
  last_login: string | null;
  created_at: string;
  updated_by: string;
};

export type Permission = {
  id: number;
  key: string;
  label: string;
  description: string;
  admin_visible: boolean;
  member_visible: boolean;
  updated_at: string;
};

export type UsageResource = {
  id: number;
  key: string;
  label: string;
  current_value: number;
  limit_value: number | null;
  unit: string;
  description: string;
  percent_used: number | null;
  updated_at: string;
};

export type ApiService = {
  id: number;
  name: string;
  base_url: string;
  openapi_url: string;
  description: string;
  enabled: boolean;
  updated_at: string;
};
