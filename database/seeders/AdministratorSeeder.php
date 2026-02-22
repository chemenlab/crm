<?php

namespace Database\Seeders;

use App\Models\Administrator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdministratorSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем первого супер-администратора
        Administrator::create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password'), // ВАЖНО: Изменить после первого входа!
            'name' => 'Super Administrator',
            'role' => 'super_admin',
            'is_active' => true,
            'two_factor_enabled' => false,
            'allowed_ips' => null, // Разрешены все IP (можно настроить позже)
        ]);

        $this->command->info('✅ Создан администратор:');
        $this->command->info('   Email: admin@example.com');
        $this->command->info('   Password: password');
        $this->command->warn('⚠️  ВАЖНО: Измените пароль после первого входа!');
    }
}
