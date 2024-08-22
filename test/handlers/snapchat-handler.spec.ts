import * as dotenv from 'dotenv';
import { SnapChatAuthHandler } from '../../src/handlers/snapchat-auth.handler';


jest.setTimeout(60000);
describe('snapchatHandler', () => {

  let snapChatClientId: string;
  let SnapChatClientSecret: string;
  let authorizationCode: string;;

  beforeAll(() => {
    dotenv.config({ path: '.env' });
    snapChatClientId = process.env.SNAPCHAT_CLIENT_ID as string;
    SnapChatClientSecret = process.env.SNAPCHAT_CLIENT_SECRET as string;
    authorizationCode = process.env.SNAPCHAT_AUTHORIZATION_CODE as string;
  });

  it('validate user with snapchat handler properly', async () => {
      const handler = new SnapChatAuthHandler({
        clientId: snapChatClientId,
        clientSecret: SnapChatClientSecret,
        redirectURI: 'https://localhost:3000/callback'
      });

      const user = await handler.validateUserCredentials({ authorizationCode });
      expect(user).not.toBeNull();
      expect(user.sub).not.toBeNull();
      expect(user.avatar).not.toBeNull();
      expect(user.accessToken).not.toBeNull();
      expect(user.refreshToken).not.toBeNull();
      expect(user.expiresIn).not.toBeNull();
      expect(user.displayName).not.toBeNull();
  });
});
