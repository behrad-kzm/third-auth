import { XAuthHandler } from '../../src'
import * as dotenv from 'dotenv';


jest.setTimeout(60000);
describe('xHandler', () => {

  let xClientId: string;
  let xClientSecret: string;
  let authorizationCode: string;;

  beforeAll(() => {
    dotenv.config({ path: '.env' });
    xClientId = process.env.X_CLIENT_ID as string;
    xClientSecret = process.env.X_CLIENT_SECRET as string;
    authorizationCode = process.env.X_AUTHORIZATION_CODE as string;
  });

  it('validate user with x handler properly', async () => {
      const handler = new XAuthHandler({
        clientId: xClientId,
        clientSecret: xClientSecret,
        redirectURI: 'http://localhost:3000/x-callback'
      });

      const user = await handler.validateUserCredentials({ authorizationCode });
      expect(user).not.toBeNull();
      expect(user.sub).not.toBeNull();
      expect(user.name).not.toBeNull();
      expect(user.username).not.toBeNull();
  });
});
