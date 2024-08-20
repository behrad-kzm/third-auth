import * as dotenv from 'dotenv';
import { LinkedInAuthHandler } from '../../src/handlers/linkedin-auth.handler';


jest.setTimeout(60000);
describe('linkedinHandler', () => {

  let xClientId: string;
  let xClientSecret: string;
  let authorizationCode: string;;

  beforeAll(() => {
    dotenv.config({ path: '.env' });
    xClientId = process.env.LINKED_IN_CLIENT_ID as string;
    xClientSecret = process.env.LINKED_IN_CLIENT_SECRET as string;
    authorizationCode = process.env.X_AUTHORIZATION_CODE as string;
  });

  it('validate user with x handler properly', async () => {
      const handler = new LinkedInAuthHandler({
        clientId: xClientId,
        clientSecret: xClientSecret,
        redirectURI: 'http://localhost:3000/callback'
      });

      const user = await handler.validateUserCredentials({ authorizationCode });

      expect(user).not.toBeNull();
      expect(user.sub).not.toBeNull();
      expect(user.name).not.toBeNull();
      expect(user.accessToken).not.toBeNull();
      expect(user.raw).not.toBeNull();
  });
});
