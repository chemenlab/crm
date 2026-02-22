<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:255',
            'timezone' => 'sometimes|required|string|timezone',
            'address' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
            'instagram' => 'sometimes|nullable|string|max:255',
            'vk' => 'sometimes|nullable|string|max:255',
            'telegram' => 'sometimes|nullable|string|max:255',
            'whatsapp' => 'sometimes|nullable|string|max:255',
            'tax_rate' => 'sometimes|nullable|numeric|min:0|max:100',
            'slug' => 'sometimes|required|string|max:255|unique:users,slug,' . $this->user()->id,
            'site_title' => 'sometimes|nullable|string|max:255',
            'site_description' => 'sometimes|nullable|string',
            'theme_color' => 'sometimes|nullable|string|max:7',
        ];
    }
}
