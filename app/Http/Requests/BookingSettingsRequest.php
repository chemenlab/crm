<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slot_step' => [
                'required',
                'integer',
                'min:15',
                'max:120',
                function ($attribute, $value, $fail) {
                    if ($value % 5 !== 0) {
                        $fail('Шаг должен быть кратен 5 минутам.');
                    }
                },
            ],
            'buffer_time' => [
                'required',
                'integer',
                'min:0',
                'max:60',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'slot_step.required' => 'Шаг сетки времени обязателен.',
            'slot_step.integer' => 'Шаг сетки времени должен быть целым числом.',
            'slot_step.min' => 'Шаг сетки времени должен быть не менее 15 минут.',
            'slot_step.max' => 'Шаг сетки времени должен быть не более 120 минут.',
            'buffer_time.required' => 'Время перерыва обязательно.',
            'buffer_time.integer' => 'Время перерыва должно быть целым числом.',
            'buffer_time.min' => 'Время перерыва не может быть отрицательным.',
            'buffer_time.max' => 'Время перерыва должно быть не более 60 минут.',
        ];
    }
}
