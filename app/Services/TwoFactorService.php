<?php

namespace App\Services;

use App\Models\User;
use App\Models\TwoFactorAuth;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TwoFactorService
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Generate a new secret key for 2FA.
     */
    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Generate QR code for 2FA setup.
     */
    public function generateQrCode(User $user, string $secret): string
    {
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );

        $writer = new Writer($renderer);
        $qrCodeSvg = $writer->writeString($qrCodeUrl);

        return 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);
    }

    /**
     * Verify a TOTP code.
     * Accepts codes from current and previous time window (60 seconds total).
     */
    public function verifyCode(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code, 1); // 1 = accept previous window
    }

    /**
     * Generate recovery codes.
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(4) . '-' . Str::random(4));
        }

        return $codes;
    }

    /**
     * Enable 2FA for a user.
     */
    public function enable(User $user, string $secret, array $recoveryCodes): TwoFactorAuth
    {
        // Hash recovery codes before storing
        $hashedCodes = array_map(function ($code) {
            return [
                'code' => Hash::make($code),
                'used' => false,
            ];
        }, $recoveryCodes);

        return TwoFactorAuth::updateOrCreate(
            ['user_id' => $user->id],
            [
                'secret' => encrypt($secret),
                'recovery_codes' => $hashedCodes,
                'enabled_at' => now(),
            ]
        );
    }

    /**
     * Disable 2FA for a user.
     */
    public function disable(User $user): void
    {
        $user->twoFactorAuth()->delete();
    }

    /**
     * Verify a recovery code.
     */
    public function verifyRecoveryCode(User $user, string $code): bool
    {
        $twoFactor = $user->twoFactorAuth;

        if (!$twoFactor) {
            return false;
        }

        $recoveryCodes = $twoFactor->recovery_codes ?? [];

        foreach ($recoveryCodes as $index => $recoveryCode) {
            if (!$recoveryCode['used'] && Hash::check($code, $recoveryCode['code'])) {
                // Mark code as used
                $recoveryCodes[$index]['used'] = true;
                $twoFactor->update(['recovery_codes' => $recoveryCodes]);
                
                return true;
            }
        }

        return false;
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(User $user): array
    {
        $twoFactor = $user->twoFactorAuth;

        if (!$twoFactor) {
            throw new \Exception('2FA is not enabled for this user');
        }

        $newCodes = $this->generateRecoveryCodes();

        // Hash new codes
        $hashedCodes = array_map(function ($code) {
            return [
                'code' => Hash::make($code),
                'used' => false,
            ];
        }, $newCodes);

        $twoFactor->update(['recovery_codes' => $hashedCodes]);

        return $newCodes;
    }
}
