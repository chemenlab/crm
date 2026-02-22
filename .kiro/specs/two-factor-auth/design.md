# Design Document: Two-Factor Authentication (2FA)

## Overview

Система 2FA добавляет дополнительный уровень безопасности через TOTP (Time-based One-Time Password). Использует стандарт RFC 6238 и совместима со всеми популярными приложениями-аутентификаторами.

## Architecture

### High-Level Flow

```
User → Enable 2FA → Generate Secret → Show QR Code
  ↓
Scan with Authenticator App → Enter TOTP Code → Verify
  ↓
Generate Recovery Codes → Save Codes → 2FA Enabled

Login Flow (with 2FA):
User → Enter Password → Verify Password → 2FA Challenge
  ↓
Enter TOTP Code → Verify Code → Login Success
```

### Components

1. **TwoFactorService** - бизнес-логика 2FA
2. **TwoFactorController** - обработка 2FA запросов
3. **TwoFactorChallengeController** - обработка 2FA при входе
4. **TwoFactorAuth Model** - хранение 2FA данных
5. **2FA UI Components** - интерфейс настройки и входа

## Components and Interfaces

### 1. TwoFactorService

**Responsibilities:**
- Генерация Secret Key
- Генерация QR кода
- Верификация TOTP кодов
- Генерация Recovery кодов
- Управление 2FA статусом

**Methods:**
```php
class TwoFactorService
{
    public function generateSecret(): string
    // Генерирует случайный Secret Key (base32)
    
    public function generateQrCode(User $user, string $secret): string
    // Генерирует QR код в формате data:image/svg+xml
    
    public function verifyCode(string $secret, string $code): bool
    // Проверяет TOTP код (текущее и предыдущее окно)
    
    public function generateRecoveryCodes(): array
    // Генерирует 8 recovery кодов
    
    public function enable(User $user, string $secret, array $recoveryCodes): void
    // Включает 2FA для пользователя
    
    public function disable(User $user): void
    // Отключает 2FA и удаляет все данные
    
    public function verifyRecoveryCode(User $user, string $code): bool
    // Проверяет и использует recovery код
    
    public function regenerateRecoveryCodes(User $user): array
    // Генерирует новые recovery коды
}
```

### 2. TwoFactorController

**Responsibilities:**
- Отображение настроек 2FA
- Включение/отключение 2FA
- Регенерация recovery кодов

**Methods:**
```php
class TwoFactorController extends Controller
{
    public function show(): Response
    // Показывает страницу настройки 2FA
    
    public function enable(Request $request): RedirectResponse
    // Генерирует Secret и QR код
    
    public function confirm(Request $request): RedirectResponse
    // Подтверждает включение 2FA через TOTP код
    
    public function disable(Request $request): RedirectResponse
    // Отключает 2FA после проверки пароля и TOTP
    
    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    // Генерирует новые recovery коды
}
```

### 3. TwoFactorChallengeController

**Responsibilities:**
- Отображение 2FA challenge при входе
- Верификация TOTP кодов
- Обработка recovery кодов

**Methods:**
```php
class TwoFactorChallengeController extends Controller
{
    public function show(): Response
    // Показывает страницу ввода 2FA кода
    
    public function verify(Request $request): RedirectResponse
    // Проверяет TOTP код и логинит пользователя
    
    public function useRecoveryCode(Request $request): RedirectResponse
    // Проверяет recovery код и логинит пользователя
}
```

### 4. TwoFactorAuth Model

**Database Schema:**
```php
Schema::table('two_factor_auth', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->text('secret'); // Encrypted TOTP secret
    $table->json('recovery_codes'); // Hashed recovery codes
    $table->timestamp('enabled_at');
    $table->timestamps();
    
    $table->unique('user_id');
});
```

**Methods:**
```php
class TwoFactorAuth extends Model
{
    public function user(): BelongsTo
    
    public function hasUnusedRecoveryCodes(): bool
    // Проверяет наличие неиспользованных кодов
    
    public function getUnusedRecoveryCodesCount(): int
    // Возвращает количество неиспользованных кодов
    
    public function markRecoveryCodeAsUsed(string $code): void
    // Помечает recovery код как использованный
}
```

### 5. User Model Updates

**New Methods:**
```php
class User extends Model
{
    public function twoFactorAuth(): HasOne
    // Relationship to TwoFactorAuth
    
    public function hasTwoFactorEnabled(): bool
    // Проверяет, включен ли 2FA
    
    public function getTwoFactorSecret(): ?string
    // Возвращает расшифрованный secret
}
```

## Data Models

### 2FA Setup Flow

```
1. User clicks "Enable 2FA"
   ↓
2. Generate Secret Key (base32, 32 chars)
   ↓
3. Generate QR Code (otpauth://totp/...)
   ↓
4. User scans QR Code
   ↓
5. User enters TOTP code
   ↓
6. Verify TOTP code
   ↓
7. Generate 8 Recovery Codes
   ↓
8. Save to database:
   {
     user_id: 1,
     secret: "encrypted_secret",
     recovery_codes: ["hashed_code1", "hashed_code2", ...],
     enabled_at: "2024-01-01 00:00:00"
   }
```

### 2FA Login Flow

```
1. User enters email + password
   ↓
2. Verify password
   ↓
3. Check if 2FA enabled
   ↓
4. If enabled: redirect to /two-factor-challenge
   ↓
5. User enters TOTP code
   ↓
6. Verify TOTP code (current + previous window)
   ↓
7. If valid: login user
   ↓
8. If invalid: show error, increment attempts
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: TOTP Code Validity Window
*For any* valid TOTP code, it should be accepted within 60 seconds (current + previous 30-second window).
**Validates: Requirements 8.2, 8.3**

### Property 2: Recovery Code Single Use
*For any* recovery code, once it is used successfully, it should never be accepted again.
**Validates: Requirements 4.5**

### Property 3: Secret Key Encryption
*For any* 2FA secret stored in database, it should be encrypted and never exposed in plain text.
**Validates: Requirements 8.4**

### Property 4: Recovery Code Hashing
*For any* recovery code stored in database, it should be hashed and never stored in plain text.
**Validates: Requirements 8.5**

### Property 5: Rate Limiting
*For any* user attempting 2FA verification, after 5 failed attempts within 15 minutes, further attempts should be blocked.
**Validates: Requirements 3.5, 8.6**

### Property 6: 2FA Requirement
*For any* user with 2FA enabled logging in with password, they must complete 2FA challenge before accessing the system.
**Validates: Requirements 3.1, 3.2**

### Property 7: Recovery Code Regeneration
*For any* user regenerating recovery codes, all old codes should be invalidated immediately.
**Validates: Requirements 4.7, 10.4**

## Error Handling

### 2FA Setup Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Invalid TOTP code | "Неверный код. Проверьте время на устройстве" | Allow retry |
| Already enabled | "2FA уже включен" | Redirect to settings |
| Setup timeout | "Время настройки истекло. Начните заново" | Clear temp data |

### 2FA Login Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Invalid TOTP code | "Неверный код аутентификации" | Allow retry, count attempt |
| Too many attempts | "Слишком много попыток. Попробуйте через 15 минут" | Lock for 15 min |
| Invalid recovery code | "Неверный код восстановления" | Allow retry |
| All codes used | "Все коды восстановления использованы. Обратитесь в поддержку" | Show support link |

### 2FA Disable Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Wrong password | "Неверный пароль" | Allow retry |
| Wrong TOTP code | "Неверный код аутентификации" | Allow retry |
| Not enabled | "2FA не включен" | Redirect to settings |

## Testing Strategy

### Unit Tests

1. **TwoFactorService Tests**
   - Test secret generation (length, format)
   - Test QR code generation
   - Test TOTP verification (valid/invalid codes)
   - Test recovery code generation (8 codes, unique)
   - Test recovery code verification
   - Test time window tolerance

2. **TwoFactorAuth Model Tests**
   - Test recovery code usage tracking
   - Test unused codes count
   - Test encryption/decryption

### Property-Based Tests

1. **Property Test: TOTP Time Window**
   - Generate random secrets and times
   - Verify codes are accepted within 60 seconds
   - **Validates: Requirements 8.2, 8.3**

2. **Property Test: Recovery Code Single Use**
   - Generate random recovery codes
   - Use each code once
   - Verify second use fails
   - **Validates: Requirements 4.5**

3. **Property Test: Secret Encryption**
   - Generate random secrets
   - Store in database
   - Verify never stored in plain text
   - **Validates: Requirements 8.4**

4. **Property Test: Rate Limiting**
   - Generate random users
   - Simulate 5+ failed attempts
   - Verify lockout occurs
   - **Validates: Requirements 3.5, 8.6**

### Integration Tests

1. **2FA Enable Flow**
   - Complete setup process
   - Verify secret stored encrypted
   - Verify recovery codes generated

2. **2FA Login Flow**
   - Login with password
   - Enter TOTP code
   - Verify successful login

3. **Recovery Code Flow**
   - Use recovery code to login
   - Verify code marked as used
   - Verify cannot reuse

4. **2FA Disable Flow**
   - Disable 2FA
   - Verify data deleted
   - Verify can login without 2FA

## Configuration

### Environment Variables

```env
# 2FA Configuration
TWO_FACTOR_ISSUER="${APP_NAME}"
TWO_FACTOR_WINDOW=1  # Accept codes from previous window (30 seconds)
TWO_FACTOR_RECOVERY_CODES=8  # Number of recovery codes
```

### Libraries

```bash
composer require pragmarx/google2fa-laravel
composer require bacon/bacon-qr-code
```

## UI Components

### 2FA Settings Component

```typescript
interface TwoFactorSettingsProps {
  enabled: boolean;
  enabledAt?: string;
  unusedRecoveryCodesCount?: number;
}

// Features:
// - Show 2FA status badge
// - Enable/Disable buttons
// - Regenerate recovery codes button
// - Show setup instructions
```

### 2FA Setup Modal

```typescript
interface TwoFactorSetupModalProps {
  qrCode: string;
  secret: string;
  recoveryCodes?: string[];
  step: 'qr' | 'verify' | 'codes';
}

// Features:
// - Display QR code
// - Show secret for manual entry
// - TOTP code input
// - Recovery codes display with download
```

### 2FA Challenge Page

```typescript
interface TwoFactorChallengeProps {
  attemptsLeft: number;
}

// Features:
// - 6-digit code input
// - "Use recovery code" link
// - Error messages
// - Attempts counter
```

## Security Considerations

1. **Secret Storage**: Encrypt TOTP secrets using Laravel's encryption
2. **Recovery Codes**: Hash using bcrypt before storage
3. **Rate Limiting**: 5 attempts per 15 minutes
4. **Time Sync**: Accept ±30 seconds for time drift
5. **Session Security**: Invalidate sessions on 2FA disable
6. **Audit Logging**: Log all 2FA events
7. **HTTPS Only**: Require HTTPS for 2FA pages

## Performance Considerations

1. **QR Code Generation**: Cache QR codes during setup
2. **TOTP Verification**: Use efficient algorithm (< 100ms)
3. **Database Queries**: Index on user_id
4. **Recovery Codes**: Use efficient hashing (bcrypt rounds: 10)

## Future Enhancements

1. SMS-based 2FA (backup method)
2. Hardware security keys (WebAuthn)
3. Trusted devices (skip 2FA for 30 days)
4. Backup phone numbers
5. Email-based 2FA codes
