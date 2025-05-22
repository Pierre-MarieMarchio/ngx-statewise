export interface SignupResponses {
  id: string;
  email: string;
  userName: string;
}

export interface LoginResponses {
  userId: string;
  userName: string;
  email: string;
  accessToken: string;
  expirationTime: number;
}

export interface AuthenticateResponses {
  success: boolean;
  accessToken: string;
}
