import { jwtVerify, createRemoteJWKSet } from 'jose';
import axios, { AxiosError } from 'axios';
import * as qs from 'qs';
import {
  LinkedInSignInCredentials,
  LinkedInUserCodeExchangedData,
  LinkedInUserRetrievedData,
} from '../types';

// Custom error class for handling authentication-related errors
class LinkedInAuthError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'LinkedInAuthError';
  }
}

// Constants for API endpoints and request configuration
const LINKEDIN_ISS = 'https://www.linkedin.com/oauth';
const LINKEDIN_CODE_EXCHANGE_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_JWKS_URI = 'https://www.linkedin.com/oauth/openid/jwks';
const USER_AGENT = 'Axios/1.2.0';
const OPENID_SCOPE = 'openid'; // Scope required to read user data

export class LinkedInAuthHandler {
  private readonly credentials: LinkedInSignInCredentials; // Credentials provided during initialization


  constructor(credentials: LinkedInSignInCredentials) {
    this.credentials = credentials;
  }

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

      // If successful, return the exchange data (access token, refresh token, scope)
      if ([200, 201, 204].includes(status)) {
        return {
          accessToken: data.access_token,
          expiresIn: data.expires_in,
          idToken: data.id_token,
          tokenType : data.token_type,
          scope: data.scope,
        };
      }

      // If the status is not successful, throw an XAuthError with the response data
      throw new LinkedInAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error exchanging authorization Code:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if the exchange fails
      throw new LinkedInAuthError('Failed to retrieve token from Linkedin.');
    }
  }

  /**
   * Decode and validate the given ID token using Apple's public key.
   * @param {string} idToken - ID token received from Apple.
   * @returns {Promise<any>} The decoded token payload.
   */
  private static async decodeIdToken(idToken: string): Promise<any> {

    const JWKs = createRemoteJWKSet(new URL(LINKEDIN_JWKS_URI));
    const { payload } = await jwtVerify(idToken, JWKs, {
      issuer: LINKEDIN_ISS,
    });
    return payload;
  }

  /**
   * Decode and verify the provided ID token.
   * @param {LinkedInUserCodeExchangedData} codeExchangeData - The exchanged code with idToken to be decoded.
   * @returns {Promise<GoogleUserRetrievedData>} The decoded user data.
   */
  private async retrieveUserInfo(codeExchangeData: LinkedInUserCodeExchangedData): Promise<LinkedInUserRetrievedData> {
    try {

      const decodedToken = await LinkedInAuthHandler.decodeIdToken(
        codeExchangeData.idToken
      );
      const { iss, sub, aud, email, email_verified, given_name, family_name, name, picture, locale} = decodedToken;

      // Validate token issuer
      if (!this.isIssuerValid(iss)) {
        throw new LinkedInAuthError("Token issuer is invalid.");
      }

      // Validate audience
      if (aud !== this.credentials.clientId) {
        throw new LinkedInAuthError("Token audience is invalid.");
      }

      // Validate sub
      if (!sub) {
        throw new LinkedInAuthError("Token sub is invalid.");
      }

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

  public async validateUserCredentials({
    authorizationCode
  }: {
    authorizationCode: string;
  }): Promise<LinkedInUserRetrievedData> {
    try {

      const userCredentials = await this.exchangeAuthorizationCode(authorizationCode);

      if (!userCredentials.scope.includes(OPENID_SCOPE)) {
        throw new LinkedInAuthError('OpenID not found in scope.');
      }
      
      const userInfo = await this.retrieveUserInfo(userCredentials);

      return userInfo;

    } catch (error) {
      console.error('Error validating user credentials:', error);
      throw new LinkedInAuthError('User credentials validation failed.');
    }
  }

  /**
   * Check if the token issuer is valid.
   * @param {string | undefined} issuer - The issuer to be validated.
   * @returns {boolean} True if the issuer is valid; otherwise, false.
   */
  private isIssuerValid(issuer: string | undefined): boolean {
    return (
      issuer === LINKEDIN_ISS
    );
  }
}