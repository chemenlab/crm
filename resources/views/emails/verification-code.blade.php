<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Код подтверждения</title>
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
                                        {{-- Logo icon --}}
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
                                Здравствуйте, {{ $name }}!
                            </h2>
                            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                                Для подтверждения вашего email-адреса введите код ниже.
                            </p>

                            {{-- Code box --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                                <tr>
                                    <td style="background-color:#f8fafc;border:2px solid #bef264;border-radius:10px;padding:24px;text-align:center;">
                                        <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                                            Код подтверждения
                                        </p>
                                        <span style="color:#0f172a;font-size:38px;font-weight:800;letter-spacing:10px;font-variant-numeric:tabular-nums;">
                                            {{ $code }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            {{-- Timer note --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                                <tr>
                                    <td style="background-color:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;padding:12px 16px;">
                                        <p style="margin:0;color:#854d0e;font-size:13px;">
                                            ⏱ Код действителен в течение <strong>15 минут</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                                Если вы не создавали аккаунт в mClient, просто проигнорируйте это письмо.
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
