import * as dotenv from 'dotenv';
import { LinkedInAuthHandler } from '../../src/handlers/linkedin-auth.handler';


jest.setTimeout(60000);
describe('linkedinHandler', () => {

  let linkedInClientId: string;
  let linkedInClientSecret: string;
  let authorizationCode: string;;

  beforeAll(() => {
    dotenv.config({ path: '.env' });
    linkedInClientId = process.env.LINKED_IN_CLIENT_ID as string;
    linkedInClientSecret = process.env.LINKED_IN_CLIENT_SECRET as string;
    authorizationCode = process.env.LINKED_IN_AUTHORIZATION_CODE as string;
  });

  it('validate user with LinkedIn handler properly', async () => {
      const handler = new LinkedInAuthHandler({
        clientId: linkedInClientId,
        clientSecret: linkedInClientSecret,
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
