import axios, { AxiosError } from 'axios';
import { Buffer } from 'buffer';
import * as qs from 'qs';
import {
  SnapChatSignInCredentials,
  SnapChatUserCodeExchangedData,
  SnapChatUserRetrievedData,
} from '../types';

// Custom error class for handling authentication-related errors
class SnapChatAuthError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'SnapChatAuthError';
  }
}

// Constants for API endpoints and request configuration
const SNAP_CHAT_USERS_URL = 'https://kit.snapchat.com/v1/me';         // Endpoint to retrieve user information
const SNAP_CHAT_CODE_EXCHANGE_URL = 'https://accounts.snapchat.com/accounts/oauth2/token'; // Endpoint to exchange authorization code for tokens
const USER_AGENT = 'Axios/1.2.0';                             // User-Agent header for the API requests

/**
 * Class to handle authentication via Google's OAuth flow.
 * It handles exchanging the authorization code for tokens and
 * retrieving user information from the SnapChat API.
 */
export class SnapChatAuthHandler {
  private readonly credentials: SnapChatSignInCredentials; // Credentials provided during initialization
  private readonly _accessToken: string;            // Encoded access token generated from client credentials

  /**
   * Constructor to initialize the class with client credentials.
   * The credentials are base64 encoded and stored as `_accessToken`.
   * @param credentials - The client credentials (client ID, client secret, etc.)
   */
  constructor(credentials: SnapChatSignInCredentials) {
    this.credentials = credentials;
    // Base64 encode the client credentials for authorization
    this._accessToken = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`, 'binary').toString('base64');
  }

  /**
   * Exchanges the authorization code for an access token and refresh token.
   * Makes a POST request to the token exchange endpoint.
   * @param authorizationCode - The authorization code received from the user
   * @returns Promise resolving to the exchange data containing the access token, refresh token, and scope
   * @throws SnapChatAuthError if the token exchange fails
   */
  private async exchangeAuthorizationCode(authorizationCode: string): Promise<SnapChatUserCodeExchangedData> {
    try {
      // Prepare the request payload with required parameters
      const requestData = qs.stringify({
        redirect_uri: this.credentials.redirectURI,
        code: authorizationCode,
        grant_type: 'authorization_code',
      });

      // Make the POST request to exchange the authorization code for tokens
      const { data, status } = await axios.post(SNAP_CHAT_CODE_EXCHANGE_URL, requestData, {
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
          tokenType: data.token_type,
          expiresIn: data.expires_in,
        };
      }

      // If the status is not successful, throw an SnapChatAuthError with the response data
      throw new SnapChatAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error exchanging authorization Code:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if the exchange fails
      throw new SnapChatAuthError('Failed to retrieve token from SnapChat.');
    }
  }

  /**
   * Retrieves user information from the SnapChat API using the provided access token.
   * @param accessToken - The access token obtained from the token exchange
   * @returns Promise resolving to the user's information including ID, name, and username
   * @throws SnapChatAuthError if user information retrieval fails
   */
  private async retrieveUserInfo(credentials: SnapChatUserCodeExchangedData): Promise<SnapChatUserRetrievedData> {
    try {
      // Make the GET request to the SnapChat API to retrieve user details
      const { data, status } = await axios.post(SNAP_CHAT_USERS_URL, 
        {
          query: "{me{displayName bitmoji{avatar} externalId}}"
        },
        {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          contentType: 'application/json',
          Authorization: `Bearer ${credentials.accessToken}`, // Bearer token authorization
        },
      });

      // If successful, return the user's information (id, name, username)
      if ([200, 201, 204].includes(status)) {
        return {
          sub: data.data.me.externalId,   // User ID (sub)
          displayName: data.data.me.displayName,     // User's name
          raw: data.data,
          avatar: data.data.me.bitmoji.avatar,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresIn: credentials.expiresIn
        };
      }

      // If the status is not successful, throw an SnapChatAuthError with the response data
      throw new SnapChatAuthError('Failed to execute HTTP request', status, data);

    } catch (error) {
      const axiosError = error as AxiosError<unknown, any> | null | undefined;
      // Log error details to the console for debugging
      console.error('Error retrieve user info:', axiosError?.response?.data || axiosError?.message);
      // Throw a custom authentication error if user information retrieval fails
      throw new SnapChatAuthError('Failed to retrieve user info from SnapChat.');
    }
  }

  /**
   * Validates the user's credentials by exchanging the authorization code
   * and retrieving the user's information.
   * @param authorizationCode - The authorization code received from the user
   * @returns Promise resolving to the user's information if validation is successful
   * @throws SnapChatAuthError if validation fails or required scopes are not granted
   */
  public async validateUserCredentials({
    authorizationCode
  }: {
    authorizationCode: string;
  }): Promise<SnapChatUserRetrievedData> {
    try {
      // Exchange the authorization code for tokens (access token, refresh token)
      const userCredentials = await this.exchangeAuthorizationCode(authorizationCode);

      // Retrieve the user information using the access token
      const userInfo = await this.retrieveUserInfo(userCredentials);

      return userInfo;

    } catch (error) {
      // Log error details to the console for debugging
      console.error('Error validating user credentials:', error);
      // Throw a custom authentication error if validation fails
      throw new SnapChatAuthError('User credentials validation failed.');
    }
  }
}