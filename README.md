# ThirdAuth

ThirdAuth is a simple TypeScript library to securely validate third-party authentication with Apple and Google.

## Features
- Supports multiple Apple and Google Sign-In handlers
- Manages different accounts with client IDs
- Periodically updates Apple client secrets

## Installation
```sh
npm install third-auth
```
## Usage
### Register a Handler
Register an Apple Sign-In handler:

```typescript
ThirdAuth.registerHandler({
  clientId: 'config.apple.clientId',
  clientSecret: 'config.apple.clientSecret',
  keyId: 'config.apple.keyId',
  teamId: 'config.apple.teamId',
  privateKey: 'config.apple.privateKey',
}, ThirdPartyType.Apple);
```

### Validate User Credentials
Validate an authorization code:

```typescript
const payload = await ThirdAuth
  .getAppleHandler('config.apple.clientId'))
  .validateUserCredentials({ authorizationCode: loginDto.authorizationCode });
```

### Update Apple Client Secrets
Update Apple client secrets periodically:

```typescript
await ThirdAuth.updateAppleClientSecrets();
```

### Multiple Apple Sign-In Handlers
Support multiple Apple accounts:

```typescript
ThirdAuth.registerHandler({
  clientId: 'config.apple.clientId.2',
  clientSecret: 'config.apple.clientSecret.2',
  keyId: 'config.apple.keyId.2',
  teamId: 'config.apple.teamId.2',
  privateKey: 'config.apple.privateKey.2',
}, ThirdPartyType.Apple);

const payload = await ThirdAuth
  .getAppleHandler('config.apple.clientId.2'))
  .validateUserCredentials({ authorizationCode: loginDto.authorizationCode });
```

### License
This project is licensed under the MIT License.
