<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['currentSubscription.plan'])
            ->orderBy('created_at', 'desc');

        // Фильтры
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('has_subscription')) {
            if ($request->has_subscription === 'yes') {
                $query->whereHas('currentSubscription');
            } else {
                $query->whereDoesntHave('currentSubscription');
            }
        }

        $users = $query->paginate(20)->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
                'subscription' => $user->currentSubscription ? [
                    'status' => $user->currentSubscription->status,
                    'plan' => [
                        'name' => $user->currentSubscription->plan->name,
                    ],
                ] : null,
            ];
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'has_subscription']),
        ]);
    }

    public function show(User $user)
    {
        $user->load([
            'currentSubscription.plan',
            'subscriptions.plan',
        ]);

        // Загружаем платежи за подписки
        $payments = \App\Models\Payment::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Статистика использования для мастеров
        $usageStats = [
            'total_appointments' => $user->appointments()->count(),
            'total_clients' => $user->clients()->count(),
            'total_services' => $user->services()->count(),
        ];

        return Inertia::render('Admin/Users/Show', [
            'user' => array_merge($user->toArray(), [
                'subscription' => $user->currentSubscription,
                'payments' => $payments,
                'usage_stats' => $usageStats,
            ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function store(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'create_user',
            'User',
            $user->id,
            $validated,
            "Создан пользователь: {$user->email}"
        );

        return redirect()->route('admin.users.show', $user->id)
            ->with('success', 'Пользователь успешно создан.');
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'email_verified' => 'boolean',
        ]);

        $oldData = $user->toArray();

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (isset($validated['email_verified'])) {
            $user->email_verified_at = $validated['email_verified'] ? now() : null;
        }

        $user->save();

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'update_user',
            'User',
            $user->id,
            [
                'old' => $oldData,
                'new' => $validated,
            ],
            "Обновлен пользователь: {$user->email}"
        );

        return redirect()->route('admin.users.show', $user->id)
            ->with('success', 'Пользователь успешно обновлен.');
    }

    public function destroy(User $user)
    {
        $admin = Auth::guard('admin')->user();

        // Отменяем активные подписки
        if ($user->currentSubscription && $user->currentSubscription->isValid()) {
            $user->currentSubscription->cancel();
        }

        $email = $user->email;
        $user->delete();

        // Логируем действие
        AdminActivityLog::log(
            $admin->id,
            'delete_user',
            'User',
            $user->id,
            null,
            "Удален пользователь: {$email}"
        );

        return redirect()->route('admin.users.index')
            ->with('success', 'Пользователь успешно удален.');
    }
}
