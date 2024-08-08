import { AppleAuthHandler } from "../handlers/apple-auth.handler";
import { GoogleAuthHandler } from "../handlers/google-auth.handler";

export enum ThirdPartyType {
  Apple = 'Apple',
  Google = 'Google',
}

export type AuthHandler = AppleAuthHandler | GoogleAuthHandler;

export type AuthHandlerCredential = AppleSignInCredentials | GoogleSignInCredentials;

export interface AuthHandlerInterface {
  initialize(): Promise<void>;
}

export type AppleSignInCredentials = {
  privateKey: string;
  teamId: string;
  keyId: string;
  clientId: string;
}



export type AppleSignInTokenResponse = {
  idToken: string;
  refreshToken: string;
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}


export type GoogleSignInCredentials = {
  clientId: string;
  clientSecret: string;
}

export type UserRetrievedData = {
  aud: string;
  sub: string;
  email: string;
  emailVerified: boolean;
}

export type AppleUserRetrievedData = UserRetrievedData & {
  isPrivateEmail: boolean;
}

export type GoogleUserRetrievedData = UserRetrievedData & {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
