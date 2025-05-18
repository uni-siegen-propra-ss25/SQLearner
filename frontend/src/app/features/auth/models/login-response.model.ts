export interface LoginResponse {
  accessToken: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}