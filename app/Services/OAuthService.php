<?php

namespace App\Services;

use App\Models\OAuthProvider;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class OAuthService
{
    /**
     * Result of OAuth callback with additional info.
     */
    public array $lastCallbackResult = [
        'type' => 'login', // login, register, linked
        'provider' => null,
    ];

    /**
     * Handle OAuth callback and return user.
     */
    public function handleCallback(string $provider, SocialiteUser $socialiteUser): User
    {
        return DB::transaction(function () use ($provider, $socialiteUser) {
            return $this->findOrCreateUser($provider, $socialiteUser);
        });
    }

    /**
     * Get the result type of last callback.
     */
    public function getLastCallbackResult(): array
    {
        return $this->lastCallbackResult;
    }

    /**
     * Find existing user or create new one.
     */
    public function findOrCreateUser(string $provider, SocialiteUser $socialiteUser): User
    {
        // Check if OAuth account already exists
        $oauthProvider = OAuthProvider::where('provider', $provider)
            ->where('provider_user_id', $socialiteUser->getId())
            ->first();

        if ($oauthProvider) {
            // Update token and return existing user
            $this->updateOAuthToken($oauthProvider, $socialiteUser);
            $this->lastCallbackResult = ['type' => 'login', 'provider' => $provider];
            return $oauthProvider->user;
        }

        // Check if user with this email already exists
        $user = User::where('email', $socialiteUser->getEmail())->first();

        if ($user) {
            // Link OAuth account to existing user
            $this->linkAccount($user, $provider, $socialiteUser);
            $this->lastCallbackResult = ['type' => 'linked', 'provider' => $provider];
            return $user;
        }

        // Create new user
        $user = $this->createUser($socialiteUser);
        
        // Link OAuth account
        $this->linkAccount($user, $provider, $socialiteUser);
        $this->lastCallbackResult = ['type' => 'register', 'provider' => $provider];

        return $user;
    }

    /**
     * Create new user from OAuth data.
     */
    protected function createUser(SocialiteUser $socialiteUser): User
    {
        return User::create([
            'name' => $socialiteUser->getName() ?? $socialiteUser->getNickname() ?? 'User',
            'email' => $socialiteUser->getEmail(),
            'email_verified_at' => now(), // Auto-verify OAuth users
            'password' => null, // OAuth users don't have password initially
            'onboarding_completed' => false,
        ]);
    }

    /**
     * Link OAuth account to user.
     */
    public function linkAccount(User $user, string $provider, SocialiteUser $socialiteUser): OAuthProvider
    {
        // Check if already linked
        $existing = OAuthProvider::where('user_id', $user->id)
            ->where('provider', $provider)
            ->first();

        if ($existing) {
            $this->updateOAuthToken($existing, $socialiteUser);
            return $existing;
        }

        // Create new OAuth provider link
        return OAuthProvider::create([
            'user_id' => $user->id,
            'provider' => $provider,
            'provider_user_id' => $socialiteUser->getId(),
            'access_token' => $socialiteUser->token,
            'refresh_token' => $socialiteUser->refreshToken,
            'token_expires_at' => $socialiteUser->expiresIn 
                ? now()->addSeconds($socialiteUser->expiresIn) 
                : null,
        ]);
    }

    /**
     * Update OAuth token.
     */
    protected function updateOAuthToken(OAuthProvider $oauthProvider, SocialiteUser $socialiteUser): void
    {
        $oauthProvider->update([
            'access_token' => $socialiteUser->token,
            'refresh_token' => $socialiteUser->refreshToken,
            'token_expires_at' => $socialiteUser->expiresIn 
                ? now()->addSeconds($socialiteUser->expiresIn) 
                : null,
        ]);
    }

    /**
     * Unlink OAuth account from user.
     */
    public function unlinkAccount(User $user, string $provider): bool
    {
        if (!$this->canUnlinkProvider($user, $provider)) {
            return false;
        }

        return OAuthProvider::where('user_id', $user->id)
            ->where('provider', $provider)
            ->delete() > 0;
    }

    /**
     * Check if user can unlink OAuth provider.
     * User must have at least one authentication method (password or another OAuth).
     */
    public function canUnlinkProvider(User $user, string $provider): bool
    {
        // If user has password, they can unlink any OAuth
        if ($user->hasPassword()) {
            return true;
        }

        // Count OAuth providers
        $oauthCount = $user->oauthProviders()->count();

        // Can only unlink if there are other OAuth providers
        return $oauthCount > 1;
    }
}
