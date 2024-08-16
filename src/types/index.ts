import { AppleAuthHandler } from "../handlers/apple-auth.handler";
import { GoogleAuthHandler } from "../handlers/google-auth.handler";
import { XAuthHandler } from "../handlers/x-auth.handler";

export enum ThirdPartyType {
  Apple = 'Apple',
  Google = 'Google',
  X = 'X'
}

export type AuthHandler = AppleAuthHandler | GoogleAuthHandler | XAuthHandler;

export type AuthHandlerCredential = AppleSignInCredentials | GoogleSignInCredentials | XSignInCredentials;

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

export type XSignInCredentials = {
  clientId: string;
  clientSecret: string;
  redirectURI: string;
}

export type BasicUserRetrievedData = {
  sub: string;
}

export type AppleUserRetrievedData = BasicUserRetrievedData & {
  isPrivateEmail: boolean;
  accessToken: string;
  refreshToken?: string;
  aud: string;
  email: string;
  emailVerified: boolean;
}

export type GoogleUserRetrievedData = BasicUserRetrievedData & {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  aud: string;
  email: string;
  emailVerified: boolean;
}

export type XUserRetrievedData = BasicUserRetrievedData & {
  name: string;
  username: string;
}

export type XUserCodeExchangedData = {
  accessToken: string;
  refreshToken?: string;
  scope: string;
}