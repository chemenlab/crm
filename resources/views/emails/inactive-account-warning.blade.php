<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Предупреждение об удалении аккаунта</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">MasterClient</h1>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Здравствуйте, {{ $userName }}!</h2>
        
        <p>Мы заметили, что вы давно не использовали MasterClient.</p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Внимание:</strong> Ваш аккаунт будет автоматически удалён через <strong>{{ $daysUntilDeletion }} дней</strong>, если вы не войдёте в систему.
            </p>
        </div>
        
        <p>При удалении аккаунта будут безвозвратно удалены:</p>
        <ul style="color: #4b5563;">
            <li>Все ваши записи и история</li>
            <li>База клиентов</li>
            <li>Услуги и настройки</li>
            <li>Финансовые данные</li>
            <li>Фотографии и портфолио</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/login') }}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Войти в аккаунт
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            Чтобы сохранить аккаунт, просто войдите в систему и добавьте хотя бы одну запись.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Если вы больше не планируете использовать MasterClient, можете проигнорировать это письмо.<br>
            © {{ date('Y') }} MasterClient. Все права защищены.
        </p>
    </div>
</body>
</html>
