# Design Document: OAuth Integration

## Overview

OAuth интеграция позволяет пользователям регистрироваться и входить через Google и Yandex аккаунты. Система использует Laravel Socialite для упрощения работы с OAuth провайдерами и обеспечивает безопасное хранение OAuth данных.

## Architecture

### High-Level Flow

```
User → Login/Register Page → OAuth Button Click
  ↓
Redirect to OAuth Provider (Google/Yandex)
  ↓
User Authorizes → Provider Callback
  ↓
Exchange Code for Token → Get User Data
  ↓
Create/Link Account → Login User → Redirect to Dashboard
```

### Components

1. **OAuthController** - обработка OAuth flow
2. **OAuthService** - бизнес-логика OAuth
3. **OAuthProvider Model** - хранение OAuth данных
4. **OAuth UI Components** - кнопки и интерфейс
5. **Laravel Socialite** - библиотека для OAuth

## Components and Interfaces

### 1. OAuthController

**Responsibilities:**
- Инициация OAuth flow (redirect)
- Обработка callback от провайдеров
- Обработка ошибок OAuth

**Methods:**
```php
class OAuthController extends Controller
{
    public function redirect(string $provider): RedirectResponse
    // Перенаправляет пользователя на страницу авторизации провайдера
    // $provider: 'google' или 'yandex'
    // Returns: RedirectResponse to OAuth provider
    
    public function callback(string $provider): RedirectResponse
    // Обрабатывает callback от OAuth провайдера
    // $provider: 'google' или 'yandex'
    // Returns: RedirectResponse to dashboard or login with error
    
    public function link(string $provider): RedirectResponse
    // Связывает OAuth аккаунт с текущим пользователем (из настроек)
    // Requires: auth middleware
    
    public function unlink(string $provider): RedirectResponse
    // Отвязывает OAuth аккаунт от текущего пользователя
    // Requires: auth middleware
}
```

### 2. OAuthService

**Responsibilities:**
- Получение данных пользователя от провайдера
- Создание нового пользователя
- Связывание OAuth аккаунта с существующим пользователем
- Валидация и обработка ошибок

**Methods:**
```php
class OAuthService
{
    public function handleCallback(string $provider, SocialiteUser $socialiteUser): User
    // Обрабатывает данные от OAuth провайдера
    // Returns: User instance (created or existing)
    
    public function findOrCreateUser(string $provider, SocialiteUser $socialiteUser): User
    // Находит существующего пользователя или создает нового
    
    public function linkAccount(User $user, string $provider, SocialiteUser $socialiteUser): OAuthProvider
    // Связывает OAuth аккаунт с пользователем
    
    public function unlinkAccount(User $user, string $provider): bool
    // Отвязывает OAuth аккаунт от пользователя
    // Validates: user has other auth methods
    
    public function canUnlinkProvider(User $user, string $provider): bool
    // Проверяет, можно ли отвязать провайдера
    // Returns: false if it's the only auth method
}
```

### 3. OAuthProvider Model

**Database Schema:**
```php
Schema::create('oauth_providers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('provider'); // 'google' or 'yandex'
    $table->string('provider_user_id');
    $table->text('access_token')->nullable();
    $table->text('refresh_token')->nullable();
    $table->timestamp('token_expires_at')->nullable();
    $table->timestamps();
    
    $table->unique(['provider', 'provider_user_id']);
    $table->index(['user_id', 'provider']);
});
```

**Relationships:**
- belongsTo User

**Methods:**
```php
class OAuthProvider extends Model
{
    public function user(): BelongsTo
    // Returns: User relationship
    
    public function isTokenExpired(): bool
    // Checks if access token is expired
    
    public function updateToken(string $accessToken, ?string $refreshToken = null, ?Carbon $expiresAt = null): void
    // Updates OAuth tokens
}
```

### 4. User Model Updates

**New Methods:**
```php
class User extends Model
{
    public function oauthProviders(): HasMany
    // Returns: Collection of OAuthProvider
    
    public function hasOAuthProvider(string $provider): bool
    // Checks if user has specific OAuth provider linked
    
    public function getOAuthProvider(string $provider): ?OAuthProvider
    // Gets specific OAuth provider
    
    public function hasPassword(): bool
    // Checks if user has password set
    // Returns: true if password is not null
    
    public function canRemoveOAuthProvider(string $provider): bool
    // Checks if OAuth provider can be removed
    // Returns: false if it's the only auth method
}
```

## Data Models

### OAuth Provider Data Flow

```
OAuth Provider Response:
{
  id: "123456789",
  email: "user@example.com",
  name: "Ivan Ivanov",
  avatar: "https://..."
}
  ↓
OAuthProvider Model:
{
  user_id: 1,
  provider: "google",
  provider_user_id: "123456789",
  access_token: "encrypted_token",
  refresh_token: "encrypted_token",
  token_expires_at: "2024-01-01 00:00:00"
}
  ↓
User Model:
{
  id: 1,
  name: "Ivan Ivanov",
  email: "user@example.com",
  email_verified_at: "2024-01-01 00:00:00", // Auto-verified for OAuth
  password: null // Can be null for OAuth-only users
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OAuth Account Uniqueness
*For any* OAuth provider and provider user ID combination, there should be at most one OAuthProvider record in the database.
**Validates: Requirements 5.1, 5.2**

### Property 2: Email Auto-Verification
*For any* new user created via OAuth, their email_verified_at field should be set to the current timestamp.
**Validates: Requirements 4.1**

### Property 3: Account Linking Safety
*For any* user attempting to unlink an OAuth provider, if they have no password and no other OAuth providers, the unlink operation should fail.
**Validates: Requirements 3.5**

### Property 4: OAuth Data Security
*For any* API response or log entry, OAuth access tokens and refresh tokens should never be exposed in plain text.
**Validates: Requirements 5.5**

### Property 5: Provider Validation
*For any* OAuth callback request, the provider parameter should be validated against the allowed list ('google', 'yandex').
**Validates: Requirements 8.3**

### Property 6: Email Conflict Resolution
*For any* OAuth authentication attempt, if the email already exists with a different OAuth provider, the system should link the new provider to the existing user.
**Validates: Requirements 1.4, 2.4**

### Property 7: State Parameter Validation
*For any* OAuth callback, the state parameter should be validated to match the one sent in the redirect request.
**Validates: Requirements 8.2**

## Error Handling

### OAuth Provider Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| User denied permission | "Вы отменили вход через [Provider]" | Redirect to login |
| Invalid credentials | "Ошибка аутентификации. Попробуйте снова" | Redirect to login |
| Network error | "Ошибка соединения. Попробуйте позже" | Redirect to login |
| Email already used | "Email уже используется другим аккаунтом" | Redirect to login |
| Provider not supported | "Провайдер не поддерживается" | Redirect to login |
| Token expired | "Сессия истекла. Войдите снова" | Redirect to login |

### Account Management Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Cannot unlink last auth method | "Невозможно отключить единственный способ входа" | Show error, prevent action |
| Provider not linked | "Аккаунт не подключен" | Show error |
| Already linked | "Аккаунт уже подключен" | Show info message |

## Testing Strategy

### Unit Tests

1. **OAuthService Tests**
   - Test findOrCreateUser with new email
   - Test findOrCreateUser with existing email
   - Test linkAccount success
   - Test unlinkAccount with multiple auth methods
   - Test unlinkAccount with single auth method (should fail)
   - Test canUnlinkProvider logic

2. **OAuthProvider Model Tests**
   - Test isTokenExpired with expired token
   - Test isTokenExpired with valid token
   - Test updateToken

3. **User Model Tests**
   - Test hasOAuthProvider
   - Test getOAuthProvider
   - Test hasPassword
   - Test canRemoveOAuthProvider

### Property-Based Tests

1. **Property Test: OAuth Account Uniqueness**
   - Generate random provider and provider_user_id combinations
   - Attempt to create duplicate OAuthProvider records
   - Verify database constraint prevents duplicates
   - **Validates: Requirements 5.1, 5.2**

2. **Property Test: Email Auto-Verification**
   - Generate random OAuth user data
   - Create users via OAuth flow
   - Verify all have email_verified_at set
   - **Validates: Requirements 4.1**

3. **Property Test: Account Linking Safety**
   - Generate random users with various auth method combinations
   - Attempt to unlink OAuth providers
   - Verify users always have at least one auth method
   - **Validates: Requirements 3.5**

4. **Property Test: OAuth Data Security**
   - Generate random OAuth tokens
   - Store in database and retrieve via API
   - Verify tokens are never exposed in responses
   - **Validates: Requirements 5.5**

### Integration Tests

1. **Google OAuth Flow**
   - Mock Google OAuth response
   - Test complete flow from redirect to callback
   - Verify user creation and login

2. **Yandex OAuth Flow**
   - Mock Yandex OAuth response
   - Test complete flow from redirect to callback
   - Verify user creation and login

3. **Account Linking Flow**
   - Create user with password
   - Link Google account
   - Link Yandex account
   - Verify both are linked

4. **Account Unlinking Flow**
   - Create user with password and OAuth
   - Unlink OAuth
   - Verify OAuth removed but user can still login with password

### Manual Testing

1. Test Google OAuth on production Google OAuth
2. Test Yandex OAuth on production Yandex OAuth
3. Test UI on different browsers and devices
4. Test error scenarios (deny permission, network errors)

## Configuration

### Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"

# Yandex OAuth
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI="${APP_URL}/auth/yandex/callback"
```

### Socialite Configuration

```php
// config/services.php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],

'yandex' => [
    'client_id' => env('YANDEX_CLIENT_ID'),
    'client_secret' => env('YANDEX_CLIENT_SECRET'),
    'redirect' => env('YANDEX_REDIRECT_URI'),
],
```

## UI Components

### OAuth Buttons Component

```typescript
interface OAuthButtonsProps {
  mode: 'login' | 'register' | 'settings';
  onSuccess?: () => void;
}

// Features:
// - Display Google and Yandex buttons
// - Show provider logos
// - Handle loading states
// - Show error messages
// - Responsive layout
```

### Connected Accounts Component (Settings)

```typescript
interface ConnectedAccountsProps {
  providers: {
    google?: { connected: boolean; email?: string };
    yandex?: { connected: boolean; email?: string };
  };
  hasPassword: boolean;
}

// Features:
// - Show connected/disconnected status
// - Connect/Disconnect buttons
// - Prevent disconnecting last auth method
// - Show confirmation dialog for disconnect
```

## Security Considerations

1. **CSRF Protection**: Use state parameter in OAuth flow
2. **Token Storage**: Encrypt OAuth tokens in database
3. **HTTPS Only**: All OAuth callbacks must use HTTPS
4. **Provider Validation**: Validate provider parameter
5. **Email Verification**: Trust OAuth provider's email verification
6. **Rate Limiting**: Limit OAuth callback attempts
7. **Error Logging**: Log OAuth errors without exposing tokens

## Performance Considerations

1. **Database Indexes**: Index on (user_id, provider) and (provider, provider_user_id)
2. **Token Caching**: Cache OAuth tokens in Redis if needed
3. **Async Operations**: Queue email notifications for new OAuth users
4. **Connection Pooling**: Reuse HTTP connections to OAuth providers

## Future Enhancements

1. Support for additional OAuth providers (VK, Facebook)
2. OAuth token refresh mechanism
3. OAuth scope management
4. OAuth provider profile sync
5. Multiple accounts per provider
