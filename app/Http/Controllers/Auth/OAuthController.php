<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\OAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class OAuthController extends Controller
{
    public function __construct(
        private OAuthService $oauthService
    ) {}

    /**
     * Redirect to OAuth provider.
     */
    public function redirect(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            return Socialite::driver($provider)->redirect();
        } catch (Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Ошибка при перенаправлении на ' . $this->getProviderName($provider));
        }
    }

    /**
     * Handle OAuth callback.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        file_put_contents(storage_path('logs/oauth_debug.log'), date('Y-m-d H:i:s') . " [START] provider={$provider}\n", FILE_APPEND);
        \Log::info('[OAuth] callback started', ['provider' => $provider]);

        try {
            $socialiteUser = Socialite::driver($provider)->user();
            file_put_contents(storage_path('logs/oauth_debug.log'), date('Y-m-d H:i:s') . " [SOCIALITE OK] email=" . $socialiteUser->getEmail() . "\n", FILE_APPEND);
            \Log::info('[OAuth] socialite user retrieved', ['email' => $socialiteUser->getEmail()]);

            // Handle OAuth callback
            $user = $this->oauthService->handleCallback($provider, $socialiteUser);
            \Log::info('[OAuth] user resolved', ['user_id' => $user->id]);

            // Login user and regenerate session (prevents session fixation)
            Auth::login($user, true);
            $request->session()->regenerate();
            \Log::info('[OAuth] auth login done', ['auth_check' => Auth::check(), 'session_id' => session()->getId()]);

            // Get callback result for appropriate message
            $result = $this->oauthService->getLastCallbackResult();
            $providerName = $this->getProviderName($provider);

            $message = match($result['type']) {
                'register' => 'Добро пожаловать! Аккаунт создан через ' . $providerName,
                'linked' => 'Аккаунт ' . $providerName . ' связан с вашим существующим аккаунтом',
                default => 'Вы успешно вошли через ' . $providerName,
            };

            // Redirect to dashboard
            return redirect()->route('dashboard')->with('success', $message);

        } catch (Exception $e) {
            file_put_contents(storage_path('logs/oauth_debug.log'), date('Y-m-d H:i:s') . " [EXCEPTION] " . get_class($e) . ": " . $e->getMessage() . "\n", FILE_APPEND);
            \Log::error('[OAuth] callback error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
                'class' => get_class($e),
            ]);

            return redirect()->route('login')
                ->with('error', $this->getErrorMessage($e, $provider));
        }
    }

    /**
     * Link OAuth account to current user (from settings).
     */
    public function link(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            $socialiteUser = Socialite::driver($provider)->user();
            
            // Check if this OAuth account is already linked to another user
            $existingProvider = \App\Models\OAuthProvider::where('provider', $provider)
                ->where('provider_user_id', $socialiteUser->getId())
                ->first();

            if ($existingProvider && $existingProvider->user_id !== Auth::id()) {
                return redirect()->route('settings.index')
                    ->with('error', 'Этот аккаунт ' . $this->getProviderName($provider) . ' уже используется другим пользователем');
            }

            // Link account
            $this->oauthService->linkAccount(Auth::user(), $provider, $socialiteUser);
            
            return redirect()->route('settings.index')
                ->with('success', 'Аккаунт ' . $this->getProviderName($provider) . ' успешно подключен');
                
        } catch (Exception $e) {
            \Log::error('OAuth link error', [
                'provider' => $provider,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('settings.index')
                ->with('error', 'Ошибка при подключении аккаунта ' . $this->getProviderName($provider));
        }
    }

    /**
     * Unlink OAuth account from current user.
     */
    public function unlink(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        $user = Auth::user();

        if (!$user->hasOAuthProvider($provider)) {
            return redirect()->route('settings.index')
                ->with('error', 'Аккаунт ' . $this->getProviderName($provider) . ' не подключен');
        }

        if (!$this->oauthService->canUnlinkProvider($user, $provider)) {
            return redirect()->route('settings.index')
                ->with('error', 'Невозможно отключить единственный способ входа. Установите пароль или подключите другой аккаунт.');
        }

        $this->oauthService->unlinkAccount($user, $provider);

        return redirect()->route('settings.index')
            ->with('success', 'Аккаунт ' . $this->getProviderName($provider) . ' успешно отключен');
    }

    /**
     * Validate OAuth provider.
     */
    protected function validateProvider(string $provider): void
    {
        if (!in_array($provider, ['google', 'yandex'])) {
            abort(404, 'Провайдер не поддерживается');
        }
    }

    /**
     * Get provider display name.
     */
    protected function getProviderName(string $provider): string
    {
        return match($provider) {
            'google' => 'Google',
            'yandex' => 'Yandex',
            default => $provider,
        };
    }

    /**
     * Get user-friendly error message.
     */
    protected function getErrorMessage(Exception $e, string $provider): string
    {
        $message = $e->getMessage();

        // User denied permission
        if (str_contains($message, 'access_denied') || str_contains($message, 'denied')) {
            return 'Вы отменили вход через ' . $this->getProviderName($provider);
        }

        // Invalid credentials
        if (str_contains($message, 'invalid_credentials') || str_contains($message, 'invalid_grant')) {
            return 'Ошибка аутентификации. Попробуйте снова';
        }

        // Network error
        if (str_contains($message, 'cURL') || str_contains($message, 'connection')) {
            return 'Ошибка соединения. Попробуйте позже';
        }

        // Default error
        return 'Ошибка при входе через ' . $this->getProviderName($provider) . '. Попробуйте снова';
    }
}
