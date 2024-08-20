import { OAuth2Client } from "google-auth-library";
import {
  GoogleSignInCredentials,
  GoogleUserRetrievedData,
} from "../types";

// Error handling class to throw customized errors
class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

// Constants for configuration
const GOOGLE_ISSUER = "accounts.google.com";
const GOOGLE_ISSUER_ALT = "https://accounts.google.com";

export class GoogleAuthHandler {
  private readonly credentials: GoogleSignInCredentials;
  private services: OAuth2Client;

  constructor(credentials: GoogleSignInCredentials) {
    this.credentials = credentials;
    this.services = new OAuth2Client({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });
  }

  /**
   * Initialize the Google Auth Handler.
   * This method fetches public keys, which is not necessary for regular ID token verification.
   * However, this is maintained for completeness or specific requirements.
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    await this.services.getIapPublicKeysAsync();
  }

  /**
   * Decode and verify the provided ID token.
   * @param {string} idToken - The ID token to be decoded.
   * @returns {Promise<GoogleUserRetrievedData>} The decoded user data.
   */
  private async decodeIdToken(idToken: string): Promise<GoogleUserRetrievedData> {
    try {
      const ticket = await this.services.verifyIdToken({
        idToken,
        audience: this.credentials.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new GoogleAuthError("Failed to decode token: No payload found.");
      }

      // Validate token issuer
      if (!this.isIssuerValid(payload.iss)) {
        throw new GoogleAuthError("Token issuer is invalid.");
      }

      // Validate audience
      if (payload.aud !== this.credentials.clientId) {
        throw new GoogleAuthError("Token audience is invalid.");
      }

      // validate email
      if (!payload.email) {
        throw new GoogleAuthError("Token email is invalid.");
      }
      return {
        aud: payload.aud,
        sub: payload.sub,
        raw: payload,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatar: payload.picture,
      };
    } catch (error) {
      console.error("Error decoding ID token:", error);
      throw new GoogleAuthError("Failed to decode ID token.");
    }
  }

  /**
   * Validate user credentials using the provided ID token.
   * @param {object} params - Parameters containing the ID token.
   * @param {string} params.idToken - The ID token to be validated.
   * @returns {Promise<GoogleUserRetrievedData>} The validated user data.
   */
  public async validateUserCredentials({
    idToken,
  }: {
    idToken: string;
  }): Promise<GoogleUserRetrievedData> {
    try {
      const decodedToken = await this.decodeIdToken(idToken);

      if (!decodedToken.emailVerified) {
        throw new GoogleAuthError("Email is not verified.");
      }

      return decodedToken;
    } catch (error) {
      console.error("Error validating user credentials:", error);
      throw new GoogleAuthError("User credentials validation failed.");
    }
  }

  /**
   * Check if the token issuer is valid.
   * @param {string | undefined} issuer - The issuer to be validated.
   * @returns {boolean} True if the issuer is valid; otherwise, false.
   */
  private isIssuerValid(issuer: string | undefined): boolean {
    return (
      issuer === GOOGLE_ISSUER || issuer === GOOGLE_ISSUER_ALT
    );
  }
}