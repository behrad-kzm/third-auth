import {
  importPKCS8,
  importJWK,
  SignJWT,
  jwtVerify,
  JWK,
  decodeProtectedHeader,
} from 'jose';
import axios, { AxiosError } from 'axios';
import * as qs from 'qs';
import {
  AppleSignInTokenResponse,
  AppleSignInCredentials,
  AppleUserRetrievedData,
  AuthHandlerInterface,
} from '../types';

// Constants for URLs and Headers
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/oauth2/v2/keys';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_ISS = 'https://appleid.apple.com';
const USER_AGENT = 'Axios/1.2.0';

// Custom error class for better error handling
class AppleAuthError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'AppleAuthError';
  }
}

export class AppleAuthHandler implements AuthHandlerInterface {
  private readonly credentials: AppleSignInCredentials;
  private clientSecret?: string;
  private static publicKeys: JWK[] = [];

  constructor(credentials: AppleSignInCredentials) {
    this.credentials = credentials;
  }

  /**
   * Initialize the handler by updating the public keys and client secret.
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    await AppleAuthHandler.updatePublicKeys();
    await this.updateClientSecret();
  }

  /**
   * Update the client secret used for communication with Apple's server.
   * @returns {Promise<string>} The client secret as a JWT.
   */
  async updateClientSecret(): Promise<string> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const privateKey = await importPKCS8(
        this.credentials.privateKey,
        'ES256'
      );

      // Create and sign the JWT
      const jwt = await new SignJWT({
        iss: this.credentials.teamId,
        iat: currentTime,
        exp: currentTime + 60 * 60 * 24 * 30, // 1 month expiration
        aud: APPLE_ISS,
        sub: this.credentials.clientId,
      })
        .setProtectedHeader({ alg: 'ES256', kid: this.credentials.keyId })
        .sign(privateKey);

      this.clientSecret = jwt;
      return jwt;
    } catch (error) {
      console.error('Error creating client secret:', error);
      throw new AppleAuthError('Failed to create client secret.');
    }
  }

  /**
   * Retrieve the public key from Apple's server by 'kid'.
   * @param {string} kid - Key ID to find the correct public key.
   * @returns {Promise<JWK>} The public key for verifying the token.
   */
  private static async getPublicKey(kid: string): Promise<JWK> {
    if (AppleAuthHandler.publicKeys.length === 0) {
      await AppleAuthHandler.updatePublicKeys();
    }
    const foundKey = AppleAuthHandler.publicKeys.find((key) => key.kid === kid);
    if (foundKey) {
      return foundKey;
    }
    // Retry fetching keys once more if not found
    await AppleAuthHandler.updatePublicKeys();
    const foundKeySecondAttempt = AppleAuthHandler.publicKeys.find(
      (key) => key.kid === kid
    );

    if (foundKeySecondAttempt) {
      return foundKeySecondAttempt;
    }

    throw new AppleAuthError('Public key not found for the provided Key ID.');
  }

  /**
   * Fetch and update Apple's public keys used for verifying token signatures.
   * @returns {Promise<JWK[]>} Array of JSON Web Keys (JWK).
   */
  private static async updatePublicKeys(): Promise<JWK[]> {
    try {
      const { status, data } = await axios.get(APPLE_KEYS_URL);

      if ([200, 201, 204].includes(status)) {
        const keys = data.keys;
        if (keys && keys.length > 0) {
          AppleAuthHandler.publicKeys = keys;
          return keys;
        }
        throw new AppleAuthError('No keys found in the response.');
      }

      throw new AppleAuthError('Failed to execute HTTP request', status, data);
    } catch (error) {
      console.error('Error fetching keys:', error);
      throw new AppleAuthError('Failed to fetch Apple public keys.');
    }
  }

  /**
   * Retrieve token from Apple server by exchanging the authorization code.
   * @param {string} authorizationCode - The authorization code received from Apple.
   * @returns {Promise<AppleSignInTokenResponse>} The token response from Apple.
   */
  private async retrieveToken(
    authorizationCode: string
  ): Promise<AppleSignInTokenResponse> {
    if (!this.clientSecret) {
      throw new AppleAuthError(
        'Client secret not set. Please call initialize() first.'
      );
    }

    try {
      const requestData = qs.stringify({
        client_id: this.credentials.clientId,
        client_secret: this.clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      });
      const { data, status } = await axios.post(APPLE_TOKEN_URL, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      if ([200, 201, 204].includes(status)) {
        return {
          idToken: data.id_token,
          refreshToken: data.refresh_token,
          accessToken: data.access_token,
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        };
      }

      throw new AppleAuthError(
        'Failed to execute HTTP request',
        status,
        data
      );
    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      console.error('Error retrieving token:', axiosError?.response?.data || axiosError?.message);
      throw new AppleAuthError('Failed to retrieve token from Apple.');
    }
  }

  /**
   * Decode and validate the given ID token using Apple's public key.
   * @param {string} idToken - ID token received from Apple.
   * @returns {Promise<any>} The decoded token payload.
   */
  private static async decodeIdToken(idToken: string): Promise<any> {
    if (AppleAuthHandler.publicKeys.length === 0) {
      throw new AppleAuthError(
        'Apple public keys not set. Please call initialize() first.'
      );
    }
    const idTokenHeader = decodeProtectedHeader(idToken);
    if (!idTokenHeader.kid) {
      throw new AppleAuthError('Failed to decode token header.');
    }
    const relatedPublicKey = await AppleAuthHandler.getPublicKey(
      idTokenHeader.kid
    );
    const publicKey = await importJWK(relatedPublicKey);
    const { payload } = await jwtVerify(idToken, publicKey);
    return payload;
  }

  /**
   * Validate user credentials by verifying the authorization code with Apple's server.
   * @param {object} params - Parameters containing the authorization code.
   * @param {string} params.authorizationCode - The authorization code from Apple.
   * @returns {Promise<AppleUserRetrievedData>} The user data retrieved from the decoded ID token.
   */
  public async validateUserCredentials({
    authorizationCode,
  }: {
    authorizationCode: string;
  }): Promise<AppleUserRetrievedData> {
    try {
      const tokenResponse = await this.retrieveToken(authorizationCode);
      const decodedToken = await AppleAuthHandler.decodeIdToken(
        tokenResponse.idToken
      );
      const { iss, sub, aud, email, email_verified, is_private_email } =
        decodedToken;

      // Validate token properties
      this.validateTokenProperties(iss, aud, sub, email_verified);

      return {
        aud,
        email,
        emailVerified: email_verified,
        isPrivateEmail: is_private_email,
        sub,
      };
    } catch (error) {
      console.error('Error validating user credentials:', error);
      throw new AppleAuthError('User credentials validation failed.');
    }
  }

  /**
   * Validate the token properties.
   * @param {string} iss - Issuer of the token.
   * @param {string} aud - Audience of the token.
   * @param {string} sub - Subject of the token.
   * @param {boolean} emailVerified - Whether the email is verified.
   * @throws {AppleAuthError} If any of the properties are invalid.
   */
  private validateTokenProperties(
    iss: string,
    aud: string,
    sub: string,
    emailVerified: boolean
  ): void {
    if (!iss.includes(APPLE_ISS)) {
      throw new AppleAuthError('Token issuer is invalid.');
    }
    if (aud !== this.credentials.clientId) {
      throw new AppleAuthError('Token audience is invalid.');
      }
      if (!sub) {
      throw new AppleAuthError('Token subject is invalid.');
      }
      if (!emailVerified) {
      throw new AppleAuthError('Email not verified.');
      }
  }
}