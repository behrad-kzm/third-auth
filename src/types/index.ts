import { AppleAuthHandler } from "../handlers/apple-auth.handler";
import { GoogleAuthHandler } from "../handlers/google-auth.handler";
import { XAuthHandler } from "../handlers/x-auth.handler";
import { LinkedInAuthHandler } from "../handlers/linkedin-auth.handler";

// Auth Handler
export type AuthHandler = 
AppleAuthHandler | 
GoogleAuthHandler | 
XAuthHandler |
LinkedInAuthHandler;

export type AuthHandlerCredential = AppleSignInCredentials | GoogleSignInCredentials | XSignInCredentials | LinkedInSignInCredentials;

export type BasicUserAuthRetrievedData = {
  sub: string;
  raw: any;
}

export enum ThirdPartyType {
  Apple = 'Apple',
  Google = 'Google',
  X = 'X',
  LinkedIn = 'LinkedIn',
}

// Google
export type GoogleSignInCredentials = {
  clientId: string;
  clientSecret: string;
}

export type GoogleUserRetrievedData = BasicUserAuthRetrievedData & {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  aud: string;
  email: string;
  emailVerified: boolean;
}


// Apple
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

export type AppleUserRetrievedData = BasicUserAuthRetrievedData & {
  isPrivateEmail: boolean;
  accessToken: string;
  refreshToken?: string;
  aud: string;
  email: string;
  emailVerified: boolean;
}


// X
export type XUserRetrievedData = BasicUserAuthRetrievedData & {
  name: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
}

export type XUserCodeExchangedData = {
  accessToken: string;
  refreshToken?: string;
  scope: string;
}

export type XSignInCredentials = {
  clientId: string;
  clientSecret: string;
  redirectURI: string;
}


// LinkedIn
export type LinkedInSignInCredentials = {
  clientId: string;
  clientSecret: string;
  redirectURI: string;
}

export type LinkedInUserCodeExchangedData = {
  accessToken: string;
  refreshToken?: string;
  scope: string;
  idToken: string;
  tokenType: string;
  refreshTokenExpiresIn?: number;
  expiresIn: number;
}

export type LinkedInUserRetrievedData = BasicUserAuthRetrievedData & {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  emailVerified?: boolean;
  accessToken: string;
}
