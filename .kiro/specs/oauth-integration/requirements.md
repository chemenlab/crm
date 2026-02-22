# Requirements Document: OAuth Integration

## Introduction

Система OAuth интеграции позволяет пользователям регистрироваться и входить в MasterPlan используя свои аккаунты Google и Yandex. Это упрощает процесс регистрации и повышает конверсию.

## Glossary

- **OAuth_System**: Система аутентификации через внешние провайдеры (Google, Yandex)
- **OAuth_Provider**: Внешний сервис аутентификации (Google или Yandex)
- **User**: Пользователь системы MasterPlan
- **OAuth_Account**: Связь между пользователем MasterPlan и его аккаунтом у OAuth провайдера
- **Callback**: URL, на который OAuth провайдер возвращает пользователя после аутентификации
- **Access_Token**: Токен доступа, полученный от OAuth провайдера
- **Provider_User_ID**: Уникальный идентификатор пользователя у OAuth провайдера

## Requirements

### Requirement 1: Google OAuth Authentication

**User Story:** As a user, I want to register and login using my Google account, so that I don't need to create a new password.

#### Acceptance Criteria

1. WHEN a user clicks "Войти через Google" on the login page, THE OAuth_System SHALL redirect the user to Google authorization page
2. WHEN Google returns the user to the callback URL with authorization code, THE OAuth_System SHALL exchange the code for access token
3. WHEN the OAuth_System receives user data from Google, THE OAuth_System SHALL create a new user account if the email doesn't exist
4. WHEN the OAuth_System receives user data from Google for an existing email, THE OAuth_System SHALL link the Google account to the existing user
5. WHEN a user successfully authenticates via Google, THE OAuth_System SHALL log the user in and redirect to dashboard
6. WHEN Google authentication fails, THE OAuth_System SHALL display an error message and redirect to login page

### Requirement 2: Yandex OAuth Authentication

**User Story:** As a user, I want to register and login using my Yandex account, so that I can use my existing Russian account.

#### Acceptance Criteria

1. WHEN a user clicks "Войти через Yandex" on the login page, THE OAuth_System SHALL redirect the user to Yandex authorization page
2. WHEN Yandex returns the user to the callback URL with authorization code, THE OAuth_System SHALL exchange the code for access token
3. WHEN the OAuth_System receives user data from Yandex, THE OAuth_System SHALL create a new user account if the email doesn't exist
4. WHEN the OAuth_System receives user data from Yandex for an existing email, THE OAuth_System SHALL link the Yandex account to the existing user
5. WHEN a user successfully authenticates via Yandex, THE OAuth_System SHALL log the user in and redirect to dashboard
6. WHEN Yandex authentication fails, THE OAuth_System SHALL display an error message and redirect to login page

### Requirement 3: OAuth Account Management

**User Story:** As a user, I want to manage my connected OAuth accounts in settings, so that I can link or unlink social accounts.

#### Acceptance Criteria

1. WHEN a user views the settings page, THE OAuth_System SHALL display all connected OAuth accounts
2. WHEN a user has not connected a specific OAuth provider, THE OAuth_System SHALL show a "Connect" button for that provider
3. WHEN a user clicks "Connect" for an OAuth provider, THE OAuth_System SHALL initiate the OAuth flow and link the account
4. WHEN a user clicks "Disconnect" for an OAuth provider, THE OAuth_System SHALL remove the OAuth account link
5. WHEN a user attempts to disconnect their only authentication method, THE OAuth_System SHALL prevent the action and display a warning
6. WHEN a user has both password and OAuth authentication, THE OAuth_System SHALL allow disconnecting OAuth accounts

### Requirement 4: Email Verification for OAuth Users

**User Story:** As a user who registered via OAuth, I want my email to be automatically verified, so that I don't need to enter a verification code.

#### Acceptance Criteria

1. WHEN a new user registers via OAuth, THE OAuth_System SHALL mark their email as verified automatically
2. WHEN an existing user links an OAuth account, THE OAuth_System SHALL not change their email verification status
3. WHEN a user registers via OAuth with an email that matches an unverified account, THE OAuth_System SHALL verify the email and link the accounts

### Requirement 5: OAuth Data Storage

**User Story:** As a system, I want to store OAuth provider data securely, so that I can manage user authentication properly.

#### Acceptance Criteria

1. WHEN a user authenticates via OAuth, THE OAuth_System SHALL store the provider name, provider user ID, and access token
2. WHEN storing OAuth data, THE OAuth_System SHALL associate it with the user account
3. WHEN a user re-authenticates via OAuth, THE OAuth_System SHALL update the access token if it has changed
4. THE OAuth_System SHALL store OAuth tokens securely in the database
5. THE OAuth_System SHALL not expose OAuth tokens in API responses or logs

### Requirement 6: OAuth Error Handling

**User Story:** As a user, I want clear error messages when OAuth authentication fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN OAuth provider returns an error, THE OAuth_System SHALL display a user-friendly error message in Russian
2. WHEN network error occurs during OAuth flow, THE OAuth_System SHALL display "Ошибка соединения. Попробуйте позже"
3. WHEN user denies OAuth permission, THE OAuth_System SHALL display "Вы отменили вход через [Provider]"
4. WHEN OAuth provider email is already used by another account with different provider, THE OAuth_System SHALL display "Email уже используется другим аккаунтом"
5. WHEN any OAuth error occurs, THE OAuth_System SHALL log the error details for debugging

### Requirement 7: OAuth UI Components

**User Story:** As a user, I want clear and attractive OAuth buttons, so that I can easily identify and use social login options.

#### Acceptance Criteria

1. WHEN a user views the login page, THE OAuth_System SHALL display OAuth buttons with provider logos
2. WHEN a user views the register page, THE OAuth_System SHALL display OAuth buttons with provider logos
3. THE OAuth_System SHALL display OAuth buttons in a visually distinct section with "или" separator
4. THE OAuth_System SHALL use provider brand colors for OAuth buttons (Google: white with border, Yandex: yellow)
5. WHEN a user hovers over an OAuth button, THE OAuth_System SHALL show hover effect
6. THE OAuth_System SHALL display OAuth buttons in mobile-responsive layout

### Requirement 8: OAuth Security

**User Story:** As a system administrator, I want OAuth authentication to be secure, so that user accounts are protected.

#### Acceptance Criteria

1. THE OAuth_System SHALL use HTTPS for all OAuth callbacks
2. THE OAuth_System SHALL validate OAuth state parameter to prevent CSRF attacks
3. THE OAuth_System SHALL validate that the OAuth callback came from the expected provider
4. THE OAuth_System SHALL not store sensitive OAuth data in session or cookies
5. THE OAuth_System SHALL use Laravel Socialite's built-in security features
6. WHEN OAuth token expires, THE OAuth_System SHALL handle the error gracefully

## Non-Functional Requirements

### Performance
- OAuth redirect should happen within 500ms
- OAuth callback processing should complete within 2 seconds
- Database queries for OAuth data should be optimized with indexes

### Compatibility
- Must work with latest versions of Google OAuth 2.0
- Must work with latest versions of Yandex OAuth 2.0
- Must work on all modern browsers (Chrome, Firefox, Safari, Edge)
- Must work on mobile devices

### Localization
- All error messages must be in Russian
- OAuth button labels must be in Russian
- Provider names should be displayed in original language (Google, Yandex)
