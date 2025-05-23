export interface LoginResponses {
  userId: string;
  userName: string;
  role: string;
  organizationId: string;
  email: string;
  accessToken: string;
  expirationTime: number;
}

export interface AuthenticateResponses {
  success: boolean;
  accessToken: string;
}
