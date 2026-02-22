<?php

namespace Database\Seeders;

use App\Models\PromoCode;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminPanelTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем тестовых пользователей-мастеров
        $masters = [];
        
        $master1 = User::create([
            'name' => 'Иван Петров',
            'email' => 'ivan@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $masters[] = $master1;

        $master2 = User::create([
            'name' => 'Мария Сидорова',
            'email' => 'maria@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $masters[] = $master2;

        $master3 = User::create([
            'name' => 'Алексей Смирнов',
            'email' => 'alexey@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $masters[] = $master3;

        // Получаем тарифные планы
        $plans = SubscriptionPlan::all();
        
        if ($plans->isEmpty()) {
            $this->command->error('Сначала запустите SubscriptionPlanSeeder!');
            return;
        }

        $basicPlan = $plans->where('slug', 'basic')->first();
        $proPlan = $plans->where('slug', 'professional')->first();
        $maxPlan = $plans->where('slug', 'maximum')->first();

        // Создаем подписки для мастеров
        
        // Мастер 1 - активная подписка Professional
        $sub1 = Subscription::create([
            'user_id' => $master1->id,
            'subscription_plan_id' => $proPlan->id,
            'status' => 'active',
            'current_period_start' => now()->subDays(10),
            'current_period_end' => now()->addDays(20),
            'auto_renew' => true,
        ]);

        // Создаем платежи для подписки 1
        Payment::create([
            'user_id' => $master1->id,
            'subscription_id' => $sub1->id,
            'yookassa_payment_id' => 'test_payment_' . uniqid(),
            'status' => 'succeeded',
            'amount' => $proPlan->price,
            'currency' => 'RUB',
            'payment_method' => 'bank_card',
            'description' => 'Оплата подписки Professional',
            'paid_at' => now()->subDays(10),
        ]);

        // Мастер 2 - триальная подписка Maximum
        $sub2 = Subscription::create([
            'user_id' => $master2->id,
            'subscription_plan_id' => $maxPlan->id,
            'status' => 'trial',
            'trial_ends_at' => now()->addDays(7),
            'current_period_start' => now(),
            'current_period_end' => now()->addDays(30),
            'auto_renew' => true,
        ]);

        // Мастер 3 - отмененная подписка Professional
        $sub3 = Subscription::create([
            'user_id' => $master3->id,
            'subscription_plan_id' => $proPlan->id,
            'status' => 'cancelled',
            'current_period_start' => now()->subDays(60),
            'current_period_end' => now()->subDays(30),
            'cancelled_at' => now()->subDays(35),
            'auto_renew' => false,
        ]);

        // Создаем платежи для подписки 3
        Payment::create([
            'user_id' => $master3->id,
            'subscription_id' => $sub3->id,
            'yookassa_payment_id' => 'test_payment_' . uniqid(),
            'status' => 'succeeded',
            'amount' => $proPlan->price,
            'currency' => 'RUB',
            'payment_method' => 'bank_card',
            'description' => 'Оплата подписки Professional',
            'paid_at' => now()->subDays(60),
        ]);

        // Обновляем current_subscription_id для пользователей
        $master1->update(['current_subscription_id' => $sub1->id]);
        $master2->update(['current_subscription_id' => $sub2->id]);

        // Создаем промокоды
        
        // Активный промокод - процентная скидка
        PromoCode::create([
            'code' => 'SUMMER2025',
            'type' => 'percentage',
            'value' => 20,
            'max_uses' => 100,
            'uses_count' => 5,
            'is_active' => true,
            'valid_from' => now()->subDays(10),
            'valid_until' => now()->addDays(50),
            'first_payment_only' => true,
        ]);

        // Активный промокод - фиксированная скидка
        PromoCode::create([
            'code' => 'WELCOME100',
            'type' => 'fixed',
            'value' => 100,
            'max_uses' => 50,
            'uses_count' => 12,
            'is_active' => true,
            'valid_from' => now()->subDays(5),
            'valid_until' => now()->addDays(25),
            'first_payment_only' => true,
        ]);

        // Активный промокод - продление триала
        PromoCode::create([
            'code' => 'TRIAL30',
            'type' => 'trial_extension',
            'value' => 30,
            'max_uses' => 20,
            'uses_count' => 3,
            'is_active' => true,
            'valid_from' => now()->subDays(3),
            'valid_until' => now()->addDays(27),
            'first_payment_only' => false,
        ]);

        // Истекший промокод
        PromoCode::create([
            'code' => 'OLDPROMO',
            'type' => 'percentage',
            'value' => 15,
            'max_uses' => 30,
            'uses_count' => 28,
            'is_active' => true,
            'valid_from' => now()->subDays(60),
            'valid_until' => now()->subDays(10),
            'first_payment_only' => true,
        ]);

        // Неактивный промокод
        PromoCode::create([
            'code' => 'DISABLED',
            'type' => 'fixed',
            'value' => 200,
            'max_uses' => 10,
            'uses_count' => 0,
            'is_active' => false,
            'first_payment_only' => false,
        ]);

        // Промокод с ограничением использований (почти исчерпан)
        PromoCode::create([
            'code' => 'LIMITED10',
            'type' => 'percentage',
            'value' => 10,
            'max_uses' => 10,
            'uses_count' => 9,
            'is_active' => true,
            'valid_until' => now()->addDays(15),
            'first_payment_only' => false,
        ]);

        $this->command->info('✅ Тестовые данные для админ-панели созданы:');
        $this->command->info('   - 3 мастера с разными подписками');
        $this->command->info('   - 6 промокодов (активные, истекшие, неактивные)');
        $this->command->info('   - Платежи для подписок');
        $this->command->info('');
        $this->command->info('Тестовые пользователи:');
        $this->command->info('   - ivan@example.com (активная подписка Professional)');
        $this->command->info('   - maria@example.com (триальная подписка Maximum)');
        $this->command->info('   - alexey@example.com (отмененная подписка)');
        $this->command->info('   Пароль для всех: password');
    }
}
