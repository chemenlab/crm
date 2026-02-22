<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InactiveAccountWarningMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public int $daysUntilDeletion
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ваш аккаунт будет удалён - MasterClient',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inactive-account-warning',
        );
    }
}
