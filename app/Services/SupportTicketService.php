<?php

namespace App\Services;

use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\SupportTicketAttachment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SupportTicketService
{
    /**
     * Создать новый тикет
     */
    public function createTicket(array $data, User $user): SupportTicket
    {
        try {
            return DB::transaction(function () use ($data, $user) {
                $ticket = SupportTicket::create([
                    'user_id' => $user->id,
                    'ticket_number' => $this->generateTicketNumber(),
                    'subject' => $data['subject'],
                    'category' => $data['category'],
                    'priority' => $data['priority'] ?? 'medium',
                    'status' => 'new',
                ]);

                // Добавляем первое сообщение
                $message = $ticket->messages()->create([
                    'author_type' => get_class($user),
                    'author_id' => $user->id,
                    'user_id' => $user->id,
                    'message' => $data['message'],
                    'is_internal_note' => false,
                ]);

                // Обрабатываем прикрепленные файлы
                if (!empty($data['attachments'])) {
                    $this->handleAttachments($message, $data['attachments']);
                }

                return $ticket->load(['user', 'messages.attachments']);
            });
        } catch (\Exception $e) {
            \Log::error('Failed to create support ticket', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            throw $e;
        }
    }

    /**
     * Добавить сообщение в тикет
     */
    public function addMessage(
        SupportTicket $ticket,
        string $messageText,
        $author, // User или Administrator
        bool $isInternal = false,
        array $attachments = []
    ): SupportTicketMessage {
        try {
            return DB::transaction(function () use ($ticket, $messageText, $author, $isInternal, $attachments) {
                $message = $ticket->messages()->create([
                    'author_type' => get_class($author),
                    'author_id' => $author->id,
                    'user_id' => $author instanceof User ? $author->id : null, // для обратной совместимости
                    'message' => $messageText,
                    'is_internal_note' => $isInternal,
                ]);

                // Обрабатываем прикрепленные файлы
                if (!empty($attachments)) {
                    $this->handleAttachments($message, $attachments);
                }

                return $message->load('attachments', 'author');
            });
        } catch (\Exception $e) {
            \Log::error('Failed to add message to support ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'author_id' => $author->id,
                'author_type' => get_class($author),
            ]);
            throw $e;
        }
    }

    /**
     * Изменить статус тикета
     */
    public function changeStatus(
        SupportTicket $ticket,
        string $status,
        $admin, // User или Administrator
        ?string $resolutionSummary = null
    ): SupportTicket {
        try {
            $ticket->update([
                'status' => $status,
                'resolution_summary' => $resolutionSummary,
            ]);

            return $ticket->fresh();
        } catch (\Exception $e) {
            \Log::error('Failed to change support ticket status', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'status' => $status,
            ]);
            throw $e;
        }
    }

    /**
     * Назначить тикет администратору
     */
    public function assignTicket(SupportTicket $ticket, $admin): SupportTicket
    {
        try {
            $ticket->update([
                'assigned_admin_id' => $admin->id,
            ]);

            return $ticket->fresh(['assignedAdmin']);
        } catch (\Exception $e) {
            \Log::error('Failed to assign support ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
                'admin_id' => $admin->id,
            ]);
            throw $e;
        }
    }

    /**
     * Закрыть тикет
     */
    public function closeTicket(SupportTicket $ticket, User $user): SupportTicket
    {
        try {
            $ticket->update([
                'status' => 'closed',
            ]);

            return $ticket->fresh();
        } catch (\Exception $e) {
            \Log::error('Failed to close support ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            throw $e;
        }
    }

    /**
     * Переоткрыть тикет
     */
    public function reopenTicket(SupportTicket $ticket, User $user): SupportTicket
    {
        try {
            $ticket->update([
                'status' => 'in_progress',
            ]);

            return $ticket->fresh();
        } catch (\Exception $e) {
            \Log::error('Failed to reopen support ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            throw $e;
        }
    }

    /**
     * Оценить качество поддержки
     */
    public function rateTicket(
        SupportTicket $ticket,
        int $rating,
        ?string $comment = null
    ): SupportTicket {
        try {
            $ticket->update([
                'rating' => $rating,
                'rating_comment' => $comment,
            ]);

            return $ticket->fresh();
        } catch (\Exception $e) {
            \Log::error('Failed to rate support ticket', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            throw $e;
        }
    }

    /**
     * Генерировать уникальный номер тикета
     */
    public function generateTicketNumber(): string
    {
        do {
            $number = 'ST-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        } while (SupportTicket::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Обработать прикрепленные файлы
     */
    private function handleAttachments(SupportTicketMessage $message, array $attachments): void
    {
        foreach ($attachments as $file) {
            try {
                $path = $file->store('support-tickets', 'public');

                $message->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to upload attachment', [
                    'error' => $e->getMessage(),
                    'message_id' => $message->id,
                ]);
                // Продолжаем обработку остальных файлов
            }
        }
    }
}
