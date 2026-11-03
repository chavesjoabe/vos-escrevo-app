import { AuthSession, User } from '../domain/user';
import { ApiError, AUTH_SESSION_STORAGE_KEY, httpClient } from './httpClient';

const LOCAL_USERS_STORAGE_KEY = 'commented_bible_local_users_v1';

interface StoredLocalUser extends User {
  password: string;
}

function getLocalUsers(): StoredLocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: StoredLocalUser[]): void {
  localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(users));
}

export const authApi = {
  getStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.token === 'string' &&
        parsed.token.trim().length > 0 &&
        typeof parsed?.user?.id === 'string' &&
        typeof parsed?.user?.email === 'string'
      ) {
        return parsed as AuthSession;
      }
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    } catch {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }
  },

  saveSession(session: AuthSession): void {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  },

  async verifyStoredSession(): Promise<AuthSession | null> {
    const stored = this.getStoredSession();
    if (!stored) {
      return null;
    }
    if (stored.token.startsWith('local-token-')) {
      return stored;
    }
    try {
      const verifiedUser = await httpClient.get<User>('/auth/me');
      const updatedSession: AuthSession = {
        token: stored.token,
        user: verifiedUser,
      };
      this.saveSession(updatedSession);
      return updatedSession;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.clearSession();
        return null;
      }
      // If backend is temporarily offline, preserve current session for local fallback
      return stored;
    }
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const session = await httpClient.post<AuthSession>('/auth/login', {
        email: normalizedEmail,
        password,
      });
      this.saveSession(session);
      return session;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Offline fallback when backend server is unreachable
      const users = getLocalUsers();
      const matched = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );
      if (!matched) {
        throw new Error('E-mail ou senha inválidos.');
      }
      const fallbackSession: AuthSession = {
        token: `local-token-${matched.id}`,
        user: {
          id: matched.id,
          name: matched.name,
          email: matched.email,
        },
      };
      this.saveSession(fallbackSession);
      return fallbackSession;
    }
  },

  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    try {
      const session = await httpClient.post<AuthSession>('/auth/register', {
        name: trimmedName,
        email: normalizedEmail,
        password,
      });
      this.saveSession(session);
      return session;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Offline fallback when backend server is unreachable
      const users = getLocalUsers();
      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error(`Já existe uma conta cadastrada com o e-mail '${normalizedEmail}'.`);
      }
      const newUser: StoredLocalUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        email: normalizedEmail,
        password,
      };
      saveLocalUsers([...users, newUser]);
      const fallbackSession: AuthSession = {
        token: `local-token-${newUser.id}`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      };
      this.saveSession(fallbackSession);
      return fallbackSession;
    }
  },
};
