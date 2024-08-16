import { AppleAuthHandler } from "./handlers/apple-auth.handler";
import { GoogleAuthHandler } from "./handlers/google-auth.handler";
import { XAuthHandler } from "./handlers/x-auth.handler";
import { AppleSignInCredentials, AuthHandler, AuthHandlerCredential, GoogleSignInCredentials, ThirdPartyType, XSignInCredentials } from "./types";

export class ThirdAuth {
  private static appleHandlers: Map<string, AppleAuthHandler> = new Map();
  private static googleHandlers: Map<string, GoogleAuthHandler> = new Map();
  private static xHandlers: Map<string, XAuthHandler> = new Map();

  static async apple(credential: AppleSignInCredentials): Promise<AppleAuthHandler> {
    const appleAuthHandler = new AppleAuthHandler(credential);
    await appleAuthHandler.initialize();
    return appleAuthHandler;
  }

  static async google(credential: GoogleSignInCredentials): Promise<GoogleAuthHandler> {
    const googleAuthHandler = new GoogleAuthHandler(credential);
    await googleAuthHandler.initialize();
    return googleAuthHandler;
  }

  static x(credential: XSignInCredentials): XAuthHandler {
    const xAuthHandler = new XAuthHandler(credential);
    return xAuthHandler;
  }

  static async registerHandler(
    credential: AuthHandlerCredential,
    thirdPartyType: ThirdPartyType
  ): Promise<AuthHandler> {
    const clientId = credential.clientId;

    switch (thirdPartyType) {
      case ThirdPartyType.Apple: {
        const foundHandler = this.appleHandlers.get(clientId)
        if (foundHandler) {
          return foundHandler;
        }
        const handler = await this.apple(credential as AppleSignInCredentials);
        this.appleHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.Google: {
        const foundHandler = this.googleHandlers.get(clientId)
        if (foundHandler) {
          return foundHandler;
        }
        const handler = await this.google(credential as GoogleSignInCredentials);
        this.googleHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.X: {
        const foundHandler = this.xHandlers.get(clientId);
        if (foundHandler) {
          return foundHandler;
        }
        const handler = this.x(credential as XSignInCredentials);
        this.xHandlers.set(clientId, handler);
        return handler;
      }
      default: {
        const exhaustiveCheck: never = thirdPartyType;
        throw new Error(`${exhaustiveCheck} not implemented.`)
      }
    }
  }

  static async updateAppleClientSecrets() {
    const clientSecretUpdatesPromise = Array.from( this.appleHandlers.values() )
    .flatMap((handler) => {
      return handler.updateClientSecret();
    });

    await Promise.all(clientSecretUpdatesPromise);
  }

  static getAppleHandler(clientId: string): AppleAuthHandler {
    const handler = this.appleHandlers.get(clientId);
    if (handler) {
      return handler;
    }

    throw new Error(`Apple handler with client ID ${clientId} not found.`);
  }

  static getGoogleHandler(clientId: string): GoogleAuthHandler {
    const handler = this.googleHandlers.get(clientId);
    if (handler) {
      return handler;
    }

    throw new Error(`Google handler with client ID ${clientId} not found.`);
  }

  static getXHandler(clientId: string): XAuthHandler {
    const handler = this.xHandlers.get(clientId);
    if (handler) {
      return handler;
    }

    throw new Error(`X handler with client ID ${clientId} not found.`);
  }
}
