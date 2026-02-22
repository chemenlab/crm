# Requirements Document: Two-Factor Authentication (2FA)

## Introduction

Система двухфакторной аутентификации (2FA) добавляет дополнительный уровень безопасности к аккаунтам пользователей. После ввода пароля пользователь должен ввести одноразовый код из приложения-аутентификатора (Google Authenticator, Authy и т.д.).

## Glossary

- **2FA_System**: Система двухфакторной аутентификации
- **TOTP**: Time-based One-Time Password - одноразовый пароль на основе времени
- **Authenticator_App**: Приложение для генерации TOTP кодов (Google Authenticator, Authy, Microsoft Authenticator)
- **Secret_Key**: Секретный ключ для генерации TOTP кодов
- **QR_Code**: QR код для быстрой настройки в приложении-аутентификаторе
- **Recovery_Code**: Резервный код для восстановления доступа при потере устройства
- **User**: Пользователь системы MasterPlan
- **2FA_Challenge**: Запрос на ввод 2FA кода при входе

## Requirements

### Requirement 1: Enable 2FA

**User Story:** As a user, I want to enable two-factor authentication, so that my account is more secure.

#### Acceptance Criteria

1. WHEN a user navigates to security settings, THE 2FA_System SHALL display 2FA status (enabled/disabled)
2. WHEN a user clicks "Enable 2FA", THE 2FA_System SHALL generate a unique Secret_Key
3. WHEN Secret_Key is generated, THE 2FA_System SHALL display a QR_Code for scanning
4. WHEN QR_Code is displayed, THE 2FA_System SHALL also show the Secret_Key as text for manual entry
5. WHEN a user scans QR_Code, THE Authenticator_App SHALL start generating TOTP codes
6. WHEN a user enters valid TOTP code, THE 2FA_System SHALL enable 2FA for the account
7. WHEN 2FA is enabled, THE 2FA_System SHALL generate 8 Recovery_Codes
8. WHEN Recovery_Codes are generated, THE 2FA_System SHALL display them to the user once

### Requirement 2: Disable 2FA

**User Story:** As a user, I want to disable two-factor authentication, so that I can access my account without additional codes.

#### Acceptance Criteria

1. WHEN a user with enabled 2FA clicks "Disable 2FA", THE 2FA_System SHALL request current password
2. WHEN a user enters correct password, THE 2FA_System SHALL request TOTP code
3. WHEN a user enters valid TOTP code, THE 2FA_System SHALL disable 2FA
4. WHEN 2FA is disabled, THE 2FA_System SHALL delete Secret_Key and Recovery_Codes
5. WHEN 2FA is disabled, THE 2FA_System SHALL show confirmation message

### Requirement 3: 2FA Login Challenge

**User Story:** As a user with 2FA enabled, I want to enter a code after my password, so that my account is protected.

#### Acceptance Criteria

1. WHEN a user with enabled 2FA enters correct password, THE 2FA_System SHALL redirect to 2FA challenge page
2. WHEN 2FA challenge page is displayed, THE 2FA_System SHALL show input for 6-digit code
3. WHEN a user enters valid TOTP code, THE 2FA_System SHALL log the user in
4. WHEN a user enters invalid TOTP code, THE 2FA_System SHALL show error message
5. WHEN a user enters invalid code 5 times, THE 2FA_System SHALL lock the account for 15 minutes
6. WHEN 2FA challenge page is displayed, THE 2FA_System SHALL show "Use recovery code" link

### Requirement 4: Recovery Codes

**User Story:** As a user, I want to use recovery codes, so that I can access my account if I lose my authenticator device.

#### Acceptance Criteria

1. WHEN 2FA is enabled, THE 2FA_System SHALL generate 8 unique Recovery_Codes
2. WHEN Recovery_Codes are generated, THE 2FA_System SHALL display them once with download option
3. WHEN a user clicks "Use recovery code" on 2FA challenge, THE 2FA_System SHALL show recovery code input
4. WHEN a user enters valid Recovery_Code, THE 2FA_System SHALL log the user in
5. WHEN Recovery_Code is used, THE 2FA_System SHALL mark it as used and never accept it again
6. WHEN all Recovery_Codes are used, THE 2FA_System SHALL show warning to generate new codes
7. WHEN a user regenerates Recovery_Codes, THE 2FA_System SHALL invalidate all old codes

### Requirement 5: 2FA Setup Verification

**User Story:** As a user, I want to verify my 2FA setup before it's enabled, so that I don't lock myself out.

#### Acceptance Criteria

1. WHEN a user scans QR_Code, THE 2FA_System SHALL require entering a TOTP code before enabling
2. WHEN a user enters incorrect TOTP code during setup, THE 2FA_System SHALL show error without enabling 2FA
3. WHEN a user enters correct TOTP code during setup, THE 2FA_System SHALL enable 2FA
4. WHEN 2FA setup is cancelled, THE 2FA_System SHALL discard the Secret_Key
5. THE 2FA_System SHALL not enable 2FA until valid TOTP code is verified

### Requirement 6: 2FA Status Display

**User Story:** As a user, I want to see my 2FA status, so that I know if my account is protected.

#### Acceptance Criteria

1. WHEN a user views security settings, THE 2FA_System SHALL display 2FA status badge
2. WHEN 2FA is enabled, THE 2FA_System SHALL show "Enabled" with green indicator
3. WHEN 2FA is disabled, THE 2FA_System SHALL show "Disabled" with gray indicator
4. WHEN 2FA is enabled, THE 2FA_System SHALL show date when it was enabled
5. WHEN 2FA is enabled, THE 2FA_System SHALL show number of unused Recovery_Codes

### Requirement 7: 2FA and OAuth Compatibility

**User Story:** As a user with OAuth login, I want to enable 2FA, so that my account is secure even with social login.

#### Acceptance Criteria

1. WHEN a user has OAuth login, THE 2FA_System SHALL allow enabling 2FA
2. WHEN a user logs in via OAuth with 2FA enabled, THE 2FA_System SHALL not require 2FA code
3. WHEN a user logs in with password and has 2FA enabled, THE 2FA_System SHALL require 2FA code
4. WHEN a user has only OAuth login, THE 2FA_System SHALL show info that 2FA applies only to password login

### Requirement 8: 2FA Security

**User Story:** As a system administrator, I want 2FA to be secure, so that user accounts are protected.

#### Acceptance Criteria

1. THE 2FA_System SHALL use industry-standard TOTP algorithm (RFC 6238)
2. THE 2FA_System SHALL use 30-second time window for TOTP codes
3. THE 2FA_System SHALL accept codes from current and previous time window (60 seconds total)
4. THE 2FA_System SHALL store Secret_Keys encrypted in database
5. THE 2FA_System SHALL store Recovery_Codes hashed in database
6. THE 2FA_System SHALL rate limit 2FA verification attempts
7. THE 2FA_System SHALL log all 2FA events (enable, disable, failed attempts)

### Requirement 9: 2FA UI/UX

**User Story:** As a user, I want clear instructions for 2FA setup, so that I can configure it correctly.

#### Acceptance Criteria

1. WHEN 2FA setup starts, THE 2FA_System SHALL show step-by-step instructions
2. WHEN QR_Code is displayed, THE 2FA_System SHALL show list of compatible apps
3. WHEN Recovery_Codes are shown, THE 2FA_System SHALL emphasize saving them securely
4. WHEN 2FA challenge is shown, THE 2FA_System SHALL show clear error messages
5. THE 2FA_System SHALL use responsive design for mobile devices

### Requirement 10: 2FA Backup Options

**User Story:** As a user, I want to regenerate recovery codes, so that I have backup access if codes are lost.

#### Acceptance Criteria

1. WHEN a user views 2FA settings with enabled 2FA, THE 2FA_System SHALL show "Regenerate recovery codes" button
2. WHEN a user clicks "Regenerate recovery codes", THE 2FA_System SHALL request password confirmation
3. WHEN password is confirmed, THE 2FA_System SHALL generate 8 new Recovery_Codes
4. WHEN new Recovery_Codes are generated, THE 2FA_System SHALL invalidate all old codes
5. WHEN new Recovery_Codes are displayed, THE 2FA_System SHALL allow downloading them as text file

## Non-Functional Requirements

### Security
- TOTP Secret Keys must be encrypted at rest
- Recovery Codes must be hashed (bcrypt/argon2)
- Rate limiting: max 5 failed attempts per 15 minutes
- Session must be invalidated after 2FA is disabled
- Audit log for all 2FA operations

### Performance
- QR Code generation should complete within 500ms
- TOTP verification should complete within 100ms
- Recovery code verification should complete within 200ms

### Compatibility
- Must work with Google Authenticator
- Must work with Microsoft Authenticator
- Must work with Authy
- Must work with any RFC 6238 compliant app

### Usability
- Setup process should take less than 2 minutes
- Clear error messages in Russian
- Mobile-responsive UI
- Accessible for screen readers

### Reliability
- 2FA should not lock users out permanently
- Recovery codes provide backup access
- System should handle time drift (±30 seconds)
