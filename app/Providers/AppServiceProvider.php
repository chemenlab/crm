<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;

use App\Models\Appointment;
use App\Observers\AppointmentObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Appointment::observe(AppointmentObserver::class);

        // Mobile API rate limiters
        RateLimiter::for('mobile-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('mobile-api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Register Yandex Socialite Provider
        $socialite = $this->app->make(SocialiteFactory::class);
        $socialite->extend('yandex', function ($app) use ($socialite) {
            $config = $app['config']['services.yandex'];
            return $socialite->buildProvider(
                \SocialiteProviders\Yandex\Provider::class,
                $config
            );
        });

        // Register notification events
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\AppointmentCreated::class,
            [\App\Listeners\SendAppointmentNotification::class, 'handleCreated']
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\AppointmentUpdated::class,
            [\App\Listeners\SendAppointmentNotification::class, 'handleUpdated']
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\AppointmentCancelled::class,
            [\App\Listeners\SendAppointmentNotification::class, 'handleCancelled']
        );
    }
}
