<?php

namespace App\Services;

use App\Models\SupportTicket;
use Illuminate\Support\Facades\Response;

class SupportExportService
{
    /**
     * Экспортировать тикеты
     */
    public function exportTickets(array $filters, string $format = 'csv')
    {
        try {
            $tickets = $this->getFilteredTickets($filters);

            if ($format === 'csv') {
                return $this->exportToCsv($tickets);
            } elseif ($format === 'excel') {
                return $this->exportToExcel($tickets);
            }

            throw new \Exception('Unsupported export format');
        } catch (\Exception $e) {
            \Log::error('Failed to export tickets', [
                'error' => $e->getMessage(),
                'format' => $format,
            ]);
            throw $e;
        }
    }

    /**
     * Получить отфильтрованные тикеты
     */
    private function getFilteredTickets(array $filters)
    {
        $query = SupportTicket::with(['user', 'assignedAdmin', 'messages']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['assigned_admin_id'])) {
            $query->where('assigned_admin_id', $filters['assigned_admin_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->get();
    }

    /**
     * Экспорт в CSV
     */
    private function exportToCsv($tickets)
    {
        $filename = 'support-tickets-' . date('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($tickets) {
            $file = fopen('php://output', 'w');

            // Заголовки
            fputcsv($file, [
                'Номер тикета',
                'Тема',
                'Категория',
                'Приоритет',
                'Статус',
                'Пользователь',
                'Назначен',
                'Сообщений',
                'Оценка',
                'Создан',
            ]);

            // Данные
            foreach ($tickets as $ticket) {
                fputcsv($file, [
                    $ticket->ticket_number,
                    $ticket->subject,
                    $ticket->category,
                    $ticket->priority,
                    $ticket->status,
                    $ticket->user->name ?? '',
                    $ticket->assignedAdmin->name ?? '',
                    $ticket->messages->count(),
                    $ticket->rating ?? '',
                    $ticket->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    /**
     * Экспорт в Excel (упрощенная версия - CSV с другим расширением)
     * TODO: Использовать библиотеку для полноценного Excel
     */
    private function exportToExcel($tickets)
    {
        $filename = 'support-tickets-' . date('Y-m-d-His') . '.xlsx';
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        // Пока используем CSV формат
        // TODO: Интегрировать PhpSpreadsheet для полноценного Excel
        return $this->exportToCsv($tickets);
    }
}
