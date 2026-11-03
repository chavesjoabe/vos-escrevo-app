export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  token: string;
  user: User;
}
