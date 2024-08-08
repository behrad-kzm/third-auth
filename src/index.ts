import { ThirdAuth } from "./core";
import { AppleAuthHandler } from "./handlers/apple-auth.handler";
import { GoogleAuthHandler } from "./handlers/google-auth.handler";
import { AppleSignInCredentials, AppleUserRetrievedData, GoogleSignInCredentials, GoogleUserRetrievedData, ThirdPartyType } from "./types";

export { 
  GoogleAuthHandler,
  GoogleSignInCredentials,
  GoogleUserRetrievedData,
  AppleAuthHandler,
  AppleSignInCredentials,
  AppleUserRetrievedData,
  ThirdPartyType,
  ThirdAuth
}