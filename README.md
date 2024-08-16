
# ThirdAuth

ThirdAuth is a simple TypeScript library to securely validate third-party authentication with Apple, Google, and X (Twitter).

## Features
- Supports multiple Apple, X (Twitter), and Google Sign-In handlers
- Manages different accounts with client IDs
- Periodically updates Apple client secrets

## Installation
```sh
npm install third-auth
```

## Usage

### Register a Handler

#### Apple Sign-In Handler
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

#### X (Twitter) Sign-In Handler
Register an X (Twitter) Sign-In handler:

```typescript
ThirdAuth.registerHandler({
  clientId: 'config.x.clientId',
  clientSecret: 'config.x.clientSecret',
  redirectURI: 'config.x.redirectURI',
}, ThirdPartyType.X);
```

#### Google Sign-In Handler
Register a Google Sign-In handler:

```typescript
ThirdAuth.registerHandler({
  clientId: 'config.google.clientId',
  clientSecret: 'config.google.clientSecret',
}, ThirdPartyType.GOOGLE);
```

### Validate User Credentials

#### Apple
Validate an Apple authorization code:

```typescript
const payload = await ThirdAuth
  .getAppleHandler('config.apple.clientId')
  .validateUserCredentials({ authorizationCode: loginDto.authorizationCode });
```

#### X (Twitter)
Validate an X (Twitter) authorization code:

```typescript
const payload = await ThirdAuth
  .getXHandler('config.x.clientId')
  .validateUserCredentials({ authorizationCode: loginDto.authorizationCode });
```

#### Google
Validate a Google ID token:

```typescript
const payload = await ThirdAuth
  .getGoogleHandler('config.google.clientId')
  .validateUserCredentials({ idToken: loginDto.idToken });
```

### Update Apple Client Secrets
Update Apple client secrets periodically:

```typescript
await ThirdAuth.updateAppleClientSecrets();
```

### Multiple Apple Sign-In Handlers
Support multiple Apple, Google and X (Twitter) accounts:

```typescript
ThirdAuth.registerHandler({
  clientId: 'config.apple.clientId.2',
  clientSecret: 'config.apple.clientSecret.2',
  keyId: 'config.apple.keyId.2',
  teamId: 'config.apple.teamId.2',
  privateKey: 'config.apple.privateKey.2',
}, ThirdPartyType.Apple);

const payload = await ThirdAuth
  .getAppleHandler('config.apple.clientId.2')
  .validateUserCredentials({ authorizationCode: loginDto.authorizationCode });
```
You can do the same for google and X (Twitter) to register more than one account and authorize users with the desired clientId.

### License
This project is licensed under the MIT License.
