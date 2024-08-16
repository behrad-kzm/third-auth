import { AppleAuthHandler } from '../../src'
import * as dotenv from 'dotenv';


jest.setTimeout(60000);
describe('AppleHandler', () => {

  let appleClientId: string;
  let applePrivateKey: string;
  let appleTeamId: string;
  let appleKeyId: string;

  beforeAll(() => {
    dotenv.config({ path: '.env' });
    appleClientId = process.env.APPLE_CLIENT_ID as string;
    applePrivateKey = process.env.APPLE_PRIVATE_KEY as string;
    appleTeamId = process.env.APPLE_TEAM_ID as string;
    appleKeyId = process.env.APPLE_KEY_ID as string;
  });

  it('get public keys from apple', async () => {

    console.log({
      appleClientId,
      applePrivateKey,
      appleTeamId,
      appleKeyId
    })
    try {
      // @ts-ignore
      await AppleAuthHandler.updatePublicKeys();

      // @ts-ignore
      const publicKeys = AppleAuthHandler.publicKeys;

      expect(publicKeys.length).toBeGreaterThan(0);
    } catch (error) {
      expect(error).toBeUndefined();
    }
  });

  it('initialize apple handler properly', async () => {
      const handler = new AppleAuthHandler({
        clientId: appleClientId,
        teamId: appleTeamId,
        keyId: appleKeyId,
        privateKey: applePrivateKey
      });

      await handler.initialize();

      // @ts-ignore
      const publicKeys = AppleAuthHandler.publicKeys;
      // @ts-ignore
      const clientSecretKey = handler.clientSecret;

      expect(publicKeys.length).toBeGreaterThan(0);
      expect(clientSecretKey).toBeDefined();
  });
});
