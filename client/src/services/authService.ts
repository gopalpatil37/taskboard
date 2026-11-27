import { api } from "@/lib/api";

/** Public user fields returned by the authentication endpoints. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

/** The backend's `{ user }` response for signup, login, and current-user lookup. */
export interface AuthResponse {
  user: AuthUser;
}

export interface AuthOutletContext {
  user: AuthUser | null;
  setAuthenticatedUser: (user: AuthUser) => void;
}

/** The backend's confirmation returned after clearing the auth cookie. */
export interface LogoutResponse {
  message: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/** Creates an account and starts a session using the HTTP-only auth cookie. */
export function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const body: SignupRequest = { name, email, password };
  return api.post<AuthResponse, SignupRequest>("/api/auth/signup", body);
}

/** Verifies credentials and starts a session using the HTTP-only auth cookie. */
export function login(email: string, password: string): Promise<AuthResponse> {
  const body: LoginRequest = { email, password };
  return api.post<AuthResponse, LoginRequest>("/api/auth/login", body);
}

/** Ends the current session by asking the backend to clear its auth cookie. */
export function logout(): Promise<LogoutResponse> {
  return api.post<LogoutResponse>("/api/auth/logout");
}

/** Returns the signed-in user's public profile using the existing auth cookie. */
export function getCurrentUser(): Promise<AuthResponse> {
  return api.get<AuthResponse>("/api/auth/me");
}
