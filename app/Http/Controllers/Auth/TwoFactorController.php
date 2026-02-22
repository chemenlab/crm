<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    protected TwoFactorService $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    /**
     * Show 2FA setup page.
     */
    public function show(): Response
    {
        $user = auth()->user();
        $twoFactor = $user->twoFactorAuth;

        return Inertia::render('Auth/TwoFactorSetup', [
            'enabled' => $user->hasTwoFactorEnabled(),
            'enabledAt' => $twoFactor?->enabled_at?->format('d.m.Y H:i'),
            'unusedRecoveryCodesCount' => $twoFactor?->getUnusedRecoveryCodesCount() ?? 0,
        ]);
    }

    /**
     * Start 2FA enable process - generate secret and QR code.
     */
    public function enable(Request $request)
    {
        $user = auth()->user();

        if ($user->hasTwoFactorEnabled()) {
            return back()->with('error', '2FA уже включен');
        }

        // Generate secret
        $secret = $this->twoFactorService->generateSecret();
        
        // Generate QR code
        $qrCode = $this->twoFactorService->generateQrCode($user, $secret);

        // Store secret in session temporarily
        session(['2fa_secret' => $secret]);

        return back()->with([
            'qrCode' => $qrCode,
            'secret' => $secret,
            'step' => 'verify',
        ]);
    }

    /**
     * Confirm 2FA setup by verifying TOTP code.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = auth()->user();
        $secret = session('2fa_secret');

        if (!$secret) {
            return back()->with('error', 'Время настройки истекло. Начните заново');
        }

        // Verify TOTP code
        if (!$this->twoFactorService->verifyCode($secret, $request->code)) {
            return back()->with('error', 'Неверный код. Проверьте время на устройстве');
        }

        // Generate recovery codes
        $recoveryCodes = $this->twoFactorService->generateRecoveryCodes();

        // Enable 2FA
        $this->twoFactorService->enable($user, $secret, $recoveryCodes);

        // Clear session
        session()->forget('2fa_secret');

        return back()->with([
            'success' => '2FA успешно включен',
            'recoveryCodes' => $recoveryCodes,
            'step' => 'codes',
        ]);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $user = auth()->user();

        if (!$user->hasTwoFactorEnabled()) {
            return back()->with('error', '2FA не включен');
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            return back()->with('error', 'Неверный пароль');
        }

        // Verify TOTP code
        $secret = $user->getTwoFactorSecret();
        if (!$this->twoFactorService->verifyCode($secret, $request->code)) {
            return back()->with('error', 'Неверный код аутентификации');
        }

        // Disable 2FA
        $this->twoFactorService->disable($user);

        return back()->with('success', '2FA отключен');
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = auth()->user();

        if (!$user->hasTwoFactorEnabled()) {
            return back()->with('error', '2FA не включен');
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            return back()->with('error', 'Неверный пароль');
        }

        // Regenerate codes
        $newCodes = $this->twoFactorService->regenerateRecoveryCodes($user);

        return back()->with([
            'success' => 'Коды восстановления обновлены',
            'recoveryCodes' => $newCodes,
        ]);
    }
}
