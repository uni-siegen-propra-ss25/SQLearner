// A model for the response of the login API 
export interface LoginResponse {
  accessToken: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  matriculationNumber: string;
  role: string;
}