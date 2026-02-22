<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Восстановление пароля</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">MasterClient</h1>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Здравствуйте, {{ $userName }}!</h2>
        
        <p>Вы получили это письмо, потому что мы получили запрос на сброс пароля для вашего аккаунта.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/reset-password/' . $token . '?email=' . urlencode(request()->email ?? '')) }}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Сбросить пароль
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
            Ссылка действительна в течение 60 минут.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © {{ date('Y') }} MasterClient. Все права защищены.
        </p>
    </div>
</body>
</html>
