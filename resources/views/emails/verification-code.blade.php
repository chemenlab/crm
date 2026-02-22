<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Код подтверждения</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .code-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #000;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1 style="margin: 0; color: #000;">MasterPlan</h1>
        </div>
        
        <h2>Здравствуйте, {{ $name }}!</h2>
        
        <p>Вы получили это письмо, потому что запросили подтверждение email адреса.</p>
        
        <p>Ваш код подтверждения:</p>
        
        <div class="code-box">
            <div class="code">{{ $code }}</div>
        </div>
        
        <p>Код действителен в течение <strong>15 минут</strong>.</p>
        
        <p>Если вы не запрашивали подтверждение email, просто проигнорируйте это письмо.</p>
        
        <div class="footer">
            <p>С уважением,<br>Команда MasterPlan</p>
            <p style="font-size: 12px; color: #adb5bd;">
                Это автоматическое письмо, пожалуйста, не отвечайте на него.
            </p>
        </div>
    </div>
</body>
</html>
