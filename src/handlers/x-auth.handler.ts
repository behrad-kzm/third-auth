import axios, { AxiosError } from 'axios';
import { Buffer } from 'buffer';
import * as qs from 'qs';
import {
  XSignInCredentials,
  XUserCodeExchangedData,
  XUserRetrievedData,
} from '../types';

// Custom error class for handling authentication-related errors
class XAuthError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'XAuthError';
  }
}

// Constants for API endpoints and request configuration
const X_USERS_URL = 'https://api.x.com/2/users/me';         // Endpoint to retrieve user information
const X_CODE_EXCHANGE_URL = 'https://api.x.com/2/oauth2/token'; // Endpoint to exchange authorization code for tokens
const USER_AGENT = 'Axios/1.2.0';                             // User-Agent header for the API requests
const USER_READ_SCOPE = 'users.read';                         // Scope required to read user data
const TWEET_READ_SCOPE = 'tweet.read';                        // Scope required to read tweet data

/**
 * Class to handle authentication via Google's OAuth flow.
 * It handles exchanging the authorization code for tokens and
 * retrieving user information from the X API.
 */
export class XAuthHandler {
  private readonly credentials: XSignInCredentials; // Credentials provided during initialization
  private readonly _accessToken: string;            // Encoded access token generated from client credentials

  /**
   * Constructor to initialize the class with client credentials.
   * The credentials are base64 encoded and stored as `_accessToken`.
   * @param credentials - The client credentials (client ID, client secret, etc.)
   */
  constructor(credentials: XSignInCredentials) {
    this.credentials = credentials;
    // Base64 encode the client credentials for authorization
    this._accessToken = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`, 'binary').toString('base64');
  }

  /**
   * Exchanges the authorization code for an access token and refresh token.
   * Makes a POST request to the token exchange endpoint.
   * @param authorizationCode - The authorization code received from the user
   * @returns Promise resolving to the exchange data containing the access token, refresh token, and scope
   * @throws XAuthError if the token exchange fails
   */
  private async exchangeAuthorizationCode(authorizationCode: string): Promise<XUserCodeExchangedData> {
    try {
      // Prepare the request payload with required parameters
      const requestData = qs.stringify({
        client_id: this.credentials.clientId,
        redirect_uri: this.credentials.redirectURI,
        code: authorizationCode,
        grant_type: 'authorization_code',
        code_verifier: 'challenge',
      });

      // Make the POST request to exchange the authorization code for tokens
      const { data, status } = await axios.post(X_CODE_EXCHANGE_URL, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          Authorization: `Basic ${this._accessToken}`,
        },
      });

      // If successful, return the exchange data (access token, refresh token, scope)
      if ([200, 201, 204].includes(status)) {
        return {
          refreshToken: data.refresh_token,
          accessToken: data.access_token,
          scope: data.scope,
        };
      }

      // If the status is not successful, throw an XAuthError with the response data
      throw new XAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error exchanging authorization Code:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if the exchange fails
      throw new XAuthError('Failed to retrieve token from X.');
    }
  }

  /**
   * Retrieves user information from the X API using the provided access token.
   * @param accessToken - The access token obtained from the token exchange
   * @returns Promise resolving to the user's information including ID, name, and username
   * @throws XAuthError if user information retrieval fails
   */
  private async retrieveUserInfo(accessToken: string): Promise<XUserRetrievedData> {
    try {
      // Make the GET request to the X API to retrieve user details
      const { data, status } = await axios.get(X_USERS_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          Authorization: `Bearer ${accessToken}`, // Bearer token authorization
        },
      });

      // If successful, return the user's information (id, name, username)
      if ([200, 201, 204].includes(status)) {
        return {
          sub: data.data.id,   // User ID (sub)
          name: data.name,     // User's name
          username: data.username, // User's username
        };
      }

      // If the status is not successful, throw an XAuthError with the response data
      throw new XAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error retrieve user info:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if user information retrieval fails
      throw new XAuthError('Failed to retrieve user info from X.');
    }
  }

  /**
   * Validates the user's credentials by exchanging the authorization code
   * and retrieving the user's information.
   * @param authorizationCode - The authorization code received from the user
   * @returns Promise resolving to the user's information if validation is successful
   * @throws XAuthError if validation fails or required scopes are not granted
   */
  public async validateUserCredentials({
    authorizationCode
  }: {
    authorizationCode: string;
  }): Promise<XUserRetrievedData> {
    try {
      // Exchange the authorization code for tokens (access token, refresh token)
      const userCredentials = await this.exchangeAuthorizationCode(authorizationCode);

      // Validate that the correct scopes are granted
      if (!userCredentials.scope.includes(USER_READ_SCOPE) || !userCredentials.scope.includes(TWEET_READ_SCOPE)) {
        throw new XAuthError(
          'Invalid scope. Required scopes are not granted. Required scopes: users.read, tweet.read'
        );
      }

      // Retrieve the user information using the access token
      const userInfo = await this.retrieveUserInfo(userCredentials.accessToken);

      return userInfo;

    } catch (error) {
      // Log error details to the console for debugging
      console.error('Error validating user credentials:', error);
      // Throw a custom authentication error if validation fails
      throw new XAuthError('User credentials validation failed.');
    }
  }
}