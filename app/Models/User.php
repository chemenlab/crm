<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar_path',
        'timezone',
        'tax_system',
        'currency',
        'niche',
        'onboarding_completed',
        'avatar',
        'address',
        'city',
        'instagram',
        'vk',
        'telegram',
        'whatsapp',
        'slug',
        'tax_rate',
        'monthly_goal',
        'site_title',
        'site_description',
        'site_bio',
        'site_location',
        'social_links',
        'theme_color',
        'current_subscription_id',
        'trial_ends_at',
        'telegram_id',
        'telegram_username',
        'telegram_verification_code',
        'telegram_verified_at',
        'inactive_warning_sent_at',
        'slot_step',
        'buffer_time',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
            'trial_ends_at' => 'datetime',
            'telegram_verified_at' => 'datetime',
            'inactive_warning_sent_at' => 'datetime',
            'social_links' => 'array',
            'tax_rate' => 'float',
            'monthly_goal' => 'float',
            'slot_step' => 'integer',
            'buffer_time' => 'integer',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Cascade delete related records and files when user is deleted
        static::deleting(function ($user) {
            // Delete user files from storage
            static::deleteUserFiles($user);

            // Cascade delete related records
            $user->transactions()->delete();
            $user->appointments()->delete();
            $user->clients()->delete();
            $user->services()->delete();
            $user->clientTags()->delete();
            $user->schedules()->delete();
            $user->customFields()->delete();
            $user->userSchedules()->delete();
            $user->siteSetting()->delete();
            $user->notificationSettings()->delete();
            $user->portfolioItems()->delete();
            $user->subscriptions()->delete();
            $user->payments()->delete();
            $user->usageTracking()->delete();
            $user->promoCodeUsages()->delete();
            $user->oauthProviders()->delete();
            $user->twoFactorAuth()->delete();
            $user->emailVerificationCodes()->delete();
            $user->notificationLogs()->delete();
            $user->notificationTemplates()->delete();
            $user->supportTickets()->delete();
        });
    }

    /**
     * Delete all user files from storage.
     */
    protected static function deleteUserFiles(User $user): void
    {
        try {
            // Delete avatar
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            // Delete portfolio images
            foreach ($user->portfolioItems as $item) {
                if ($item->image_path) {
                    Storage::disk('public')->delete($item->image_path);
                }
            }

            // Delete appointment field images folder
            $appointmentFieldsFolder = 'appointment-fields/' . $user->id;
            if (Storage::disk('public')->exists($appointmentFieldsFolder)) {
                Storage::disk('public')->deleteDirectory($appointmentFieldsFolder);
            }

            // Delete user avatars folder
            $avatarsFolder = 'avatars/' . $user->id;
            if (Storage::disk('public')->exists($avatarsFolder)) {
                Storage::disk('public')->deleteDirectory($avatarsFolder);
            }

            // Delete portfolio folder
            $portfolioFolder = 'portfolio/' . $user->id;
            if (Storage::disk('public')->exists($portfolioFolder)) {
                Storage::disk('public')->deleteDirectory($portfolioFolder);
            }

            Log::info('User files deleted during account deletion', ['user_id' => $user->id]);
        } catch (\Exception $e) {
            Log::error('Failed to delete user files', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function clientTags()
    {
        return $this->hasMany(ClientTag::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function siteSetting()
    {
        return $this->hasOne(SiteSetting::class);
    }

    public function fields()
    {
        return $this->hasMany(UserField::class)->orderBy('sort_order');
    }

    public function customFields()
    {
        return $this->hasMany(CustomField::class)->orderBy('order');
    }

    public function userSchedules()
    {
        return $this->hasMany(UserSchedule::class)->orderBy('day_of_week');
    }

    public function notificationSettings()
    {
        return $this->hasOne(NotificationSetting::class);
    }

    public function twoFactorAuth()
    {
        return $this->hasOne(TwoFactorAuth::class);
    }

    public function oauthProviders()
    {
        return $this->hasMany(OAuthProvider::class);
    }

    public function emailVerificationCodes()
    {
        return $this->hasMany(EmailVerificationCode::class);
    }

    public function vkIntegration()
    {
        return $this->hasOne(VKIntegration::class);
    }

    public function telegramIntegration()
    {
        return $this->hasOne(TelegramIntegration::class);
    }

    public function notificationLogs()
    {
        return $this->hasMany(Notification::class);
    }

    public function notificationTemplates()
    {
        return $this->hasMany(NotificationTemplate::class);
    }

    public function currentSubscription()
    {
        return $this->belongsTo(Subscription::class, 'current_subscription_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function usageTracking()
    {
        return $this->hasMany(UsageTracking::class);
    }

    public function promoCodeUsages()
    {
        return $this->hasMany(PromoCodeUsage::class);
    }

    public function portfolioItems()
    {
        return $this->hasMany(PortfolioItem::class);
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    /**
     * Get user's modules
     */
    public function userModules()
    {
        return $this->hasMany(UserModule::class);
    }

    /**
     * Get user's enabled modules
     */
    public function enabledModules()
    {
        return $this->hasMany(UserModule::class)->where('is_enabled', true);
    }

    /**
     * Get user's module purchases
     */
    public function modulePurchases()
    {
        return $this->hasMany(ModulePurchase::class);
    }

    /**
     * Get user's module settings
     */
    public function moduleSettings()
    {
        return $this->hasMany(ModuleSetting::class);
    }

    /**
     * Get user's module grants
     */
    public function moduleGrants()
    {
        return $this->hasMany(ModuleGrant::class);
    }

    /**
     * Get grants given by this user (admin)
     */
    public function grantedModules()
    {
        return $this->hasMany(ModuleGrant::class, 'granted_by');
    }

    /**
     * Check if user has specific OAuth provider linked.
     */
    public function hasOAuthProvider(string $provider): bool
    {
        return $this->oauthProviders()
            ->where('provider', $provider)
            ->exists();
    }

    /**
     * Get specific OAuth provider.
     */
    public function getOAuthProvider(string $provider): ?OAuthProvider
    {
        return $this->oauthProviders()
            ->where('provider', $provider)
            ->first();
    }

    /**
     * Check if user has password set.
     */
    public function hasPassword(): bool
    {
        return !is_null($this->password);
    }

    /**
     * Check if user can remove OAuth provider.
     * User must have at least one authentication method.
     */
    public function canRemoveOAuthProvider(string $provider): bool
    {
        // If user has password, they can remove any OAuth
        if ($this->hasPassword()) {
            return true;
        }

        // Count OAuth providers
        $oauthCount = $this->oauthProviders()->count();

        // Can only remove if there are other OAuth providers
        return $oauthCount > 1;
    }

    /**
     * Check if user has two-factor authentication enabled.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->twoFactorAuth()->exists() &&
            $this->twoFactorAuth->enabled_at !== null;
    }

    /**
     * Get the decrypted two-factor secret.
     */
    public function getTwoFactorSecret(): ?string
    {
        if (!$this->twoFactorAuth) {
            return null;
        }

        try {
            return decrypt($this->twoFactorAuth->secret);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if user has active subscription
     */
    public function hasActiveSubscription(): bool
    {
        return $this->currentSubscription && $this->currentSubscription->isValid();
    }

    /**
     * Get current subscription plan
     */
    public function getCurrentPlan(): ?SubscriptionPlan
    {
        return $this->currentSubscription?->plan;
    }

    /**
     * Check if user is on trial
     */
    public function onTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    /**
     * Check if user can use feature based on subscription
     */
    public function canUseFeature(string $feature): bool
    {
        $plan = $this->getCurrentPlan();

        if (!$plan) {
            return false;
        }

        return match ($feature) {
            'analytics' => $plan->has_analytics,
            'priority_support' => $plan->has_priority_support,
            'custom_branding' => $plan->has_custom_branding,
            default => false,
        };
    }

    /**
     * Check if user has reached resource limit
     */
    public function hasReachedLimit(string $resource): bool
    {
        $plan = $this->getCurrentPlan();

        if (!$plan) {
            return true; // Без плана - нет доступа
        }

        if ($plan->isUnlimited($resource)) {
            return false;
        }

        $tracking = $this->usageTracking()
            ->forResource($resource)
            ->currentPeriod()
            ->first();

        return $tracking && $tracking->isLimitReached();
    }

    /**
     * Get remaining usage for resource
     */
    public function getRemainingUsage(string $resource): int
    {
        $plan = $this->getCurrentPlan();

        if (!$plan) {
            return 0;
        }

        if ($plan->isUnlimited($resource)) {
            return -1; // Безлимит
        }

        $tracking = $this->usageTracking()
            ->forResource($resource)
            ->currentPeriod()
            ->first();

        return $tracking ? $tracking->getRemainingUsage() : $plan->getLimit($resource);
    }
}
