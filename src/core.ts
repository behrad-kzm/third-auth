import { AppleAuthHandler } from "./handlers/apple-auth.handler";
import { GoogleAuthHandler } from "./handlers/google-auth.handler";
import { LinkedInAuthHandler } from "./handlers/linkedin-auth.handler";
import { SnapChatAuthHandler } from "./handlers/snapchat-auth.handler";
import { XAuthHandler } from "./handlers/x-auth.handler";
import { AppleSignInCredentials, AuthHandler, AuthHandlerCredential, GoogleSignInCredentials, LinkedInSignInCredentials, SnapChatSignInCredentials, ThirdPartyType, XSignInCredentials } from "./types";

export class ThirdAuth {
  private static appleHandlers: Map<string, AppleAuthHandler> = new Map();
  private static googleHandlers: Map<string, GoogleAuthHandler> = new Map();
  private static xHandlers: Map<string, XAuthHandler> = new Map();
  private static linkedInHandlers: Map<string, LinkedInAuthHandler> = new Map();
  private static snapChatHandlers: Map<string, SnapChatAuthHandler> = new Map();

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
        const handler = new AppleAuthHandler(credential as AppleSignInCredentials);
        await handler.initialize();
        this.appleHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.Google: {
        const foundHandler = this.googleHandlers.get(clientId)
        if (foundHandler) {
          return foundHandler;
        }
        const handler = new GoogleAuthHandler(credential as GoogleSignInCredentials);
        await handler.initialize();
        this.googleHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.X: {
        const foundHandler = this.xHandlers.get(clientId);
        if (foundHandler) {
          return foundHandler;
        }
        const handler = new XAuthHandler(credential as XSignInCredentials);
        this.xHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.LinkedIn: {
        const foundHandler = this.linkedInHandlers.get(clientId);
        if (foundHandler) {
          return foundHandler;
        }
        const handler = new LinkedInAuthHandler(credential as LinkedInSignInCredentials);
        this.linkedInHandlers.set(clientId, handler);
        return handler;
      }
      case ThirdPartyType.SnapChat: {
        const foundHandler = this.snapChatHandlers.get(clientId);
        if (foundHandler) {
          return foundHandler;
        }
        const handler = new SnapChatAuthHandler(credential as SnapChatSignInCredentials);
        this.snapChatHandlers.set(clientId, handler);
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

  static getLinkedInHandler(clientId: string): LinkedInAuthHandler {
    const handler = this.linkedInHandlers.get(clientId);
    if (handler) {
      return handler;
    }

    throw new Error(`LinkedIn handler with client ID ${clientId} not found.`);
  }

  static getSnapChatHandler(clientId: string): SnapChatAuthHandler {
    const handler = this.snapChatHandlers.get(clientId);
    if (handler) {
      return handler;
    }

    throw new Error(`SnapChat handler with client ID ${clientId} not found.`);
  }
}
