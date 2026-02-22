<?php

namespace App\Console\Commands\Telegram;

use Illuminate\Console\Command;
use Telegram\Bot\Laravel\Facades\Telegram;

class SetWebhookCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:set-webhook';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Установить webhook для Telegram бота';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $webhookUrl = config('telegram.bots.mybot.webhook_url');
            
            if (!$webhookUrl || $webhookUrl === 'YOUR-BOT-WEBHOOK-URL') {
                $this->error('Webhook URL не настроен в конфигурации!');
                $this->info('Убедитесь, что в .env файле установлен APP_URL');
                return 1;
            }
            
            $this->info("Установка webhook: {$webhookUrl}");
            
            $response = Telegram::setWebhook([
                'url' => $webhookUrl
            ]);
            
            if ($response) {
                $this->info('✅ Webhook успешно установлен!');
                
                // Получаем информацию о webhook
                $webhookInfo = Telegram::getWebhookInfo();
                $this->info('URL: ' . $webhookInfo->getUrl());
                $this->info('Pending updates: ' . $webhookInfo->getPendingUpdateCount());
                
                return 0;
            } else {
                $this->error('❌ Не удалось установить webhook');
                return 1;
            }
            
        } catch (\Exception $e) {
            $this->error('Ошибка: ' . $e->getMessage());
            return 1;
        }
    }
}
