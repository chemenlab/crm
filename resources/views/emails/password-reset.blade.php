<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Восстановление пароля</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">

                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin-bottom:12px;">
                                            <tr>
                                                <td style="background-color:#bef264;border-radius:8px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                                                    <span style="color:#0f172a;font-weight:900;font-size:22px;line-height:40px;display:block;">M</span>
                                                </td>
                                            </tr>
                                        </table>
                                        <br>
                                        <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                                            m<span style="color:#bef264;">Client</span>
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="background-color:#ffffff;padding:40px 40px 32px;">
                            <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700;">
                                Здравствуйте, {{ $userName }}!
                            </h2>
                            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                                Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы создать новый пароль.
                            </p>

                            {{-- CTA Button --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ url('/reset-password/' . $token . '?email=' . urlencode($email ?? '')) }}"
                                           style="display:inline-block;background-color:#bef264;color:#0f172a;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
                                            Сбросить пароль →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            {{-- Timer note --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                                <tr>
                                    <td style="background-color:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;padding:12px 16px;">
                                        <p style="margin:0;color:#854d0e;font-size:13px;">
                                            ⏱ Ссылка действительна в течение <strong>60 минут</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- Fallback URL --}}
                            <p style="margin:0 0 16px;color:#94a3b8;font-size:12px;line-height:1.6;">
                                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
                                <span style="color:#64748b;word-break:break-all;">{{ url('/reset-password/' . $token . '?email=' . urlencode($email ?? '')) }}</span>
                            </p>

                            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо — ваш пароль останется прежним.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
                            <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">
                                © {{ date('Y') }} mClient · <a href="https://mclient.pro" style="color:#64748b;text-decoration:none;">mclient.pro</a>
                            </p>
                            <p style="margin:0;color:#cbd5e1;font-size:11px;">
                                Это автоматическое письмо — пожалуйста, не отвечайте на него.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
