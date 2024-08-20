import { jwtVerify, createRemoteJWKSet } from 'jose';
import axios, { AxiosError } from 'axios';
import * as qs from 'qs';
import {
  LinkedInSignInCredentials,
  LinkedInUserCodeExchangedData,
  LinkedInUserRetrievedData,
} from '../types';

/**
 * Custom error class for handling authentication-related errors.
 * Extends the native `Error` class and includes additional properties 
 * such as `status` and `data` for more detailed error information.
 */
class LinkedInAuthError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'LinkedInAuthError';
  }
}

// Constants for API endpoints and request configuration
const LINKEDIN_ISS = 'https://www.linkedin.com/oauth'; // LinkedIn issuer URL for token validation
const LINKEDIN_CODE_EXCHANGE_URL = 'https://www.linkedin.com/oauth/v2/accessToken'; // URL to exchange authorization code for access token
const LINKEDIN_JWKS_URI = 'https://www.linkedin.com/oauth/openid/jwks'; // JSON Web Key Set URI for LinkedIn
const USER_AGENT = 'Axios/1.2.0'; // User-Agent header for HTTP requests
const OPENID_SCOPE = 'openid'; // Scope required to read user data

/**
 * Class to handle LinkedIn OAuth authentication.
 * Provides methods to exchange authorization codes for tokens,
 * decode ID tokens, and validate user credentials.
 */
export class LinkedInAuthHandler {
  private readonly credentials: LinkedInSignInCredentials; // Stores the credentials provided during initialization

  /**
   * Constructor to initialize the LinkedInAuthHandler with the necessary credentials.
   * @param {LinkedInSignInCredentials} credentials - Credentials object containing clientId, clientSecret, and redirectURI.
   */
  constructor(credentials: LinkedInSignInCredentials) {
    this.credentials = credentials;
  }

  /**
   * Exchanges the authorization code for LinkedIn tokens (access token, ID token).
   * @param {string} authorizationCode - The authorization code received from LinkedIn during OAuth flow.
   * @returns {Promise<LinkedInUserCodeExchangedData>} - Returns a promise that resolves to the token exchange data.
   * @throws {LinkedInAuthError} - Throws an error if the exchange process fails.
   */
  private async exchangeAuthorizationCode(authorizationCode: string): Promise<LinkedInUserCodeExchangedData> {
    try {
      // Prepare the request payload with required parameters
      const requestData = qs.stringify({
        client_id: this.credentials.clientId,
        redirect_uri: this.credentials.redirectURI,
        client_secret: this.credentials.clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      });

      // Make the POST request to exchange the authorization code for tokens
      const { data, status } = await axios.post(LINKEDIN_CODE_EXCHANGE_URL, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      // If the request is successful, return the token exchange data
      if ([200, 201, 204].includes(status)) {
        return {
          accessToken: data.access_token,
          expiresIn: data.expires_in,
          idToken: data.id_token,
          tokenType: data.token_type,
          scope: data.scope,
        };
      }

      // If the status is not successful, throw a LinkedInAuthError with the response data
      throw new LinkedInAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error exchanging authorization Code:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if the exchange fails
      throw new LinkedInAuthError('Failed to retrieve token from LinkedIn.');
    }
  }

  /**
   * Decodes and validates the given ID token using LinkedIn's public key.
   * @param {string} idToken - ID token received from LinkedIn.
   * @returns {Promise<any>} The decoded token payload.
   */
  private static async decodeIdToken(idToken: string): Promise<any> {
    // Fetch the JWKs (JSON Web Keys) from LinkedIn to verify the ID token's signature
    const JWKs = createRemoteJWKSet(new URL(LINKEDIN_JWKS_URI));
    const { payload } = await jwtVerify(idToken, JWKs, {
      issuer: LINKEDIN_ISS, // Validate the issuer as LinkedIn
    });
    return payload; // Return the decoded token payload
  }

  /**
   * Decodes and verifies the provided ID token, extracting user information.
   * @param {LinkedInUserCodeExchangedData} codeExchangeData - The exchanged code containing the ID token to be decoded.
   * @returns {Promise<LinkedInUserRetrievedData>} The decoded user data.
   * @throws {LinkedInAuthError} - Throws an error if token validation fails.
   */
  private async retrieveUserInfo(codeExchangeData: LinkedInUserCodeExchangedData): Promise<LinkedInUserRetrievedData> {
    try {
      // Decode the ID token to extract user data
      const decodedToken = await LinkedInAuthHandler.decodeIdToken(codeExchangeData.idToken);
      const { iss, sub, aud, email, email_verified, given_name, family_name, name, picture, locale } = decodedToken;

      // Validate token issuer
      if (!this.isIssuerValid(iss)) {
        throw new LinkedInAuthError("Token issuer is invalid.");
      }

      // Validate audience (client ID)
      if (aud !== this.credentials.clientId) {
        throw new LinkedInAuthError("Token audience is invalid.");
      }

      // Validate subject (user identifier)
      if (!sub) {
        throw new LinkedInAuthError("Token subject (sub) is invalid.");
      }

      // Return the retrieved user data along with the access token
      return {
        sub,
        raw: decodedToken,
        email,
        emailVerified: email_verified ?? false,
        name,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
        accessToken: codeExchangeData.accessToken,
      };

    } catch (error) {
      console.error("Error decoding ID token:", error);
      throw new LinkedInAuthError("Failed to decode ID token.");
    }
  }

  /**
   * Validates user credentials by exchanging an authorization code and decoding the ID token.
   * @param {object} param0 - Object containing the authorization code.
   * @param {string} param0.authorizationCode - The authorization code to be exchanged.
   * @returns {Promise<LinkedInUserRetrievedData>} The validated and decoded user data.
   * @throws {LinkedInAuthError} - Throws an error if credential validation fails.
   */
  public async validateUserCredentials({
    authorizationCode
  }: {
    authorizationCode: string;
  }): Promise<LinkedInUserRetrievedData> {
    try {
      // Exchange the authorization code for LinkedIn tokens
      const userCredentials = await this.exchangeAuthorizationCode(authorizationCode);

      // Check if the OpenID scope is present in the retrieved tokens
      if (!userCredentials.scope.includes(OPENID_SCOPE)) {
        throw new LinkedInAuthError('OpenID not found in scope.');
      }

      // Retrieve and return the user information using the ID token
      const userInfo = await this.retrieveUserInfo(userCredentials);
      return userInfo;

    } catch (error) {
      console.error('Error validating user credentials:', error);
      throw new LinkedInAuthError('User credentials validation failed.');
    }
  }

  /**
   * Validates the issuer of the ID token.
   * @param {string | undefined} issuer - The issuer to be validated.
   * @returns {boolean} True if the issuer is valid; otherwise, false.
   */
  private isIssuerValid(issuer: string | undefined): boolean {
    return issuer === LINKEDIN_ISS;
  }
}