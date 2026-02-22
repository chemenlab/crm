<?php

namespace Tests\Feature;

use App\Services\Modules\DTO\ModuleManifest;
use App\Services\Modules\DTO\ModulePricing;
use App\Services\Modules\DTO\ModuleRoutes;
use App\Services\Modules\Exceptions\InvalidManifestException;
use App\Services\Modules\HookManager;
use App\Services\Modules\ModuleEventDispatcher;
use App\Services\Modules\ModuleManifestValidator;
use App\Services\Modules\ModuleRegistry;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Feature tests for the Module System core components
 */
class ModuleSystemTest extends TestCase
{
    /**
     * Test ModuleManifest DTO creation from array
     */
    public function test_module_manifest_can_be_created_from_array(): void
    {
        $data = [
            'slug' => 'test-module',
            'name' => 'Test Module',
            'description' => 'A test module',
            'version' => '1.0.0',
            'author' => 'Test Author',
            'category' => 'other',
        ];

        $manifest = ModuleManifest::fromArray($data);

        $this->assertEquals('test-module', $manifest->slug);
        $this->assertEquals('Test Module', $manifest->name);
        $this->assertEquals('A test module', $manifest->description);
        $this->assertEquals('1.0.0', $manifest->version);
        $this->assertEquals('Test Author', $manifest->author);
        $this->assertEquals('other', $manifest->category);
    }

    /**
     * Test ModuleManifest round-trip (toArray and fromArray)
     */
    public function test_module_manifest_round_trip(): void
    {
        $data = [
            'slug' => 'test-module',
            'name' => 'Test Module',
            'description' => 'A test module',
            'version' => '1.0.0',
            'author' => 'Test Author',
            'category' => 'other',
            'icon' => 'star',
            'pricing' => ['type' => 'free'],
            'hooks' => ['sidebar.menu' => true],
            'permissions' => ['test.view', 'test.edit'],
        ];

        $manifest = ModuleManifest::fromArray($data);
        $exported = $manifest->toArray();

        $this->assertEquals($data['slug'], $exported['slug']);
        $this->assertEquals($data['name'], $exported['name']);
        $this->assertEquals($data['description'], $exported['description']);
        $this->assertEquals($data['version'], $exported['version']);
        $this->assertEquals($data['author'], $exported['author']);
        $this->assertEquals($data['category'], $exported['category']);
        $this->assertEquals($data['icon'], $exported['icon']);
        $this->assertEquals($data['hooks'], $exported['hooks']);
        $this->assertEquals($data['permissions'], $exported['permissions']);
    }

    /**
     * Test ModuleManifest isFree method
     */
    public function test_module_manifest_is_free(): void
    {
        $freeModule = ModuleManifest::fromArray([
            'slug' => 'free-module',
            'name' => 'Free Module',
            'description' => 'A free module',
            'version' => '1.0.0',
            'pricing' => ['type' => 'free'],
        ]);

        $paidModule = ModuleManifest::fromArray([
            'slug' => 'paid-module',
            'name' => 'Paid Module',
            'description' => 'A paid module',
            'version' => '1.0.0',
            'pricing' => ['type' => 'subscription', 'price' => 100],
        ]);

        $this->assertTrue($freeModule->isFree());
        $this->assertFalse($paidModule->isFree());
    }

    /**
     * Test ModulePricing DTO
     */
    public function test_module_pricing_dto(): void
    {
        $freePricing = ModulePricing::fromArray(['type' => 'free']);
        $this->assertTrue($freePricing->isFree());
        $this->assertFalse($freePricing->isSubscription());

        $subscriptionPricing = ModulePricing::fromArray([
            'type' => 'subscription',
            'price' => 100,
            'period' => 'monthly',
        ]);
        $this->assertFalse($subscriptionPricing->isFree());
        $this->assertTrue($subscriptionPricing->isSubscription());
        $this->assertEquals(100, $subscriptionPricing->price);
        $this->assertEquals('monthly', $subscriptionPricing->period);

        $oneTimePricing = ModulePricing::fromArray([
            'type' => 'one_time',
            'price' => 500,
        ]);
        $this->assertTrue($oneTimePricing->isOneTime());
    }

    /**
     * Test ModuleRoutes DTO
     */
    public function test_module_routes_dto(): void
    {
        $routes = ModuleRoutes::fromArray([
            'web' => 'Routes/web.php',
            'api' => 'Routes/api.php',
        ]);

        $this->assertTrue($routes->hasWeb());
        $this->assertTrue($routes->hasApi());
        $this->assertEquals('Routes/web.php', $routes->web);
        $this->assertEquals('Routes/api.php', $routes->api);

        $webOnlyRoutes = ModuleRoutes::fromArray(['web' => 'Routes/web.php']);
        $this->assertTrue($webOnlyRoutes->hasWeb());
        $this->assertFalse($webOnlyRoutes->hasApi());
    }

    /**
     * Test ModuleManifestValidator validates required fields
     */
    public function test_manifest_validator_requires_fields(): void
    {
        $validator = new ModuleManifestValidator();

        $this->expectException(InvalidManifestException::class);

        $validator->validate([
            'slug' => 'test',
            // missing name, description, version
        ]);
    }

    /**
     * Test ModuleManifestValidator validates slug format
     */
    public function test_manifest_validator_validates_slug_format(): void
    {
        $validator = new ModuleManifestValidator();

        // Valid slugs
        $validManifest = $validator->validate([
            'slug' => 'test-module',
            'name' => 'Test',
            'description' => 'Test',
            'version' => '1.0.0',
        ]);
        $this->assertEquals('test-module', $validManifest->slug);

        // Invalid slug (uppercase)
        $this->expectException(InvalidManifestException::class);
        $validator->validate([
            'slug' => 'Test-Module',
            'name' => 'Test',
            'description' => 'Test',
            'version' => '1.0.0',
        ]);
    }

    /**
     * Test ModuleManifestValidator validates version format
     */
    public function test_manifest_validator_validates_version_format(): void
    {
        $validator = new ModuleManifestValidator();

        // Valid version
        $manifest = $validator->validate([
            'slug' => 'test',
            'name' => 'Test',
            'description' => 'Test',
            'version' => '1.0.0',
        ]);
        $this->assertEquals('1.0.0', $manifest->version);

        // Invalid version
        $this->expectException(InvalidManifestException::class);
        $validator->validate([
            'slug' => 'test',
            'name' => 'Test',
            'description' => 'Test',
            'version' => 'invalid',
        ]);
    }

    /**
     * Test HookManager registration and execution
     */
    public function test_hook_manager_registration(): void
    {
        $hookManager = new HookManager();

        $hookManager->register('sidebar.menu', 'test-module', function ($context) {
            return ['label' => 'Test', 'icon' => 'star'];
        });

        $this->assertTrue($hookManager->hasHooks('sidebar.menu'));
        $this->assertTrue($hookManager->moduleHasHook('test-module', 'sidebar.menu'));
        $this->assertFalse($hookManager->hasHooks('dashboard.widgets'));
    }

    /**
     * Test HookManager execution without user context
     */
    public function test_hook_manager_execution_without_user(): void
    {
        $hookManager = new HookManager();

        $hookManager->register('sidebar.menu', 'module-a', function ($context) {
            return ['label' => 'Module A'];
        }, 10);

        $hookManager->register('sidebar.menu', 'module-b', function ($context) {
            return ['label' => 'Module B'];
        }, 5);

        // Without user context, all hooks should execute
        $results = $hookManager->execute('sidebar.menu', []);

        $this->assertCount(2, $results);
        // Module B should be first (priority 5 < 10)
        $this->assertEquals('Module B', $results[0]['data']['label']);
        $this->assertEquals('Module A', $results[1]['data']['label']);
    }

    /**
     * Test HookManager priority ordering
     */
    public function test_hook_manager_priority_ordering(): void
    {
        $hookManager = new HookManager();

        $hookManager->register('test.hook', 'module-low', fn() => 'low', 100);
        $hookManager->register('test.hook', 'module-high', fn() => 'high', 1);
        $hookManager->register('test.hook', 'module-medium', fn() => 'medium', 50);

        $results = $hookManager->executeFlat('test.hook');

        $this->assertEquals(['high', 'medium', 'low'], $results);
    }

    /**
     * Test HookManager module removal
     */
    public function test_hook_manager_module_removal(): void
    {
        $hookManager = new HookManager();

        $hookManager->register('sidebar.menu', 'test-module', fn() => 'test');
        $hookManager->register('dashboard.widgets', 'test-module', fn() => 'widget');

        $this->assertTrue($hookManager->moduleHasHook('test-module', 'sidebar.menu'));
        $this->assertTrue($hookManager->moduleHasHook('test-module', 'dashboard.widgets'));

        $hookManager->removeModule('test-module');

        $this->assertFalse($hookManager->moduleHasHook('test-module', 'sidebar.menu'));
        $this->assertFalse($hookManager->moduleHasHook('test-module', 'dashboard.widgets'));
    }

    /**
     * Test ModuleEventDispatcher subscription
     */
    public function test_event_dispatcher_subscription(): void
    {
        $dispatcher = new ModuleEventDispatcher();

        $dispatcher->subscribe('appointment.created', 'test-module', function ($payload) {
            // Handler
        });

        $this->assertTrue($dispatcher->hasSubscribers('appointment.created'));
        $this->assertTrue($dispatcher->isSubscribed('appointment.created', 'test-module'));
        $this->assertFalse($dispatcher->hasSubscribers('appointment.updated'));
    }

    /**
     * Test ModuleEventDispatcher dispatch without user context
     */
    public function test_event_dispatcher_dispatch_without_user(): void
    {
        $dispatcher = new ModuleEventDispatcher();
        $received = [];

        $dispatcher->subscribe('test.event', 'module-a', function ($payload) use (&$received) {
            $received[] = ['module' => 'a', 'payload' => $payload];
        });

        $dispatcher->subscribe('test.event', 'module-b', function ($payload) use (&$received) {
            $received[] = ['module' => 'b', 'payload' => $payload];
        });

        $dispatcher->dispatch('test.event', ['data' => 'test']);

        $this->assertCount(2, $received);
        $this->assertEquals('test', $received[0]['payload']['data']);
    }

    /**
     * Test ModuleEventDispatcher module unsubscription
     */
    public function test_event_dispatcher_unsubscribe_module(): void
    {
        $dispatcher = new ModuleEventDispatcher();

        $dispatcher->subscribe('event.a', 'test-module', fn() => null);
        $dispatcher->subscribe('event.b', 'test-module', fn() => null);

        $this->assertTrue($dispatcher->isSubscribed('event.a', 'test-module'));
        $this->assertTrue($dispatcher->isSubscribed('event.b', 'test-module'));

        $dispatcher->unsubscribeModule('test-module');

        $this->assertFalse($dispatcher->isSubscribed('event.a', 'test-module'));
        $this->assertFalse($dispatcher->isSubscribed('event.b', 'test-module'));
    }

    /**
     * Test ModuleEventDispatcher core event detection
     */
    public function test_event_dispatcher_core_event_detection(): void
    {
        $dispatcher = new ModuleEventDispatcher();

        $this->assertTrue($dispatcher->isCoreEvent('appointment.created'));
        $this->assertTrue($dispatcher->isCoreEvent('client.created'));
        $this->assertFalse($dispatcher->isCoreEvent('custom.event'));
    }

    /**
     * Test ModuleEventDispatcher module event detection
     */
    public function test_event_dispatcher_module_event_detection(): void
    {
        $dispatcher = new ModuleEventDispatcher();

        $this->assertTrue($dispatcher->isModuleEvent('module.reviews.created'));
        $this->assertFalse($dispatcher->isModuleEvent('appointment.created'));

        $this->assertEquals('reviews', $dispatcher->getSourceModuleFromEvent('module.reviews.created'));
        $this->assertNull($dispatcher->getSourceModuleFromEvent('appointment.created'));
    }

    /**
     * Test HookManager available hook points
     */
    public function test_hook_manager_available_hook_points(): void
    {
        $hookManager = new HookManager();

        $hookPoints = $hookManager->getAvailableHookPoints();

        $this->assertContains('sidebar.menu', $hookPoints);
        $this->assertContains('dashboard.widgets', $hookPoints);
        $this->assertContains('client.card.tabs', $hookPoints);
        $this->assertContains('settings.sections', $hookPoints);
    }

    /**
     * Test HookManager valid hook point check
     */
    public function test_hook_manager_valid_hook_point_check(): void
    {
        $hookManager = new HookManager();

        $this->assertTrue($hookManager->isValidHookPoint('sidebar.menu'));
        $this->assertTrue($hookManager->isValidHookPoint('dashboard.widgets'));
        $this->assertFalse($hookManager->isValidHookPoint('invalid.hook'));
    }

    /**
     * Test ModuleRegistry discovers modules from directory
     */
    public function test_module_registry_discovers_modules(): void
    {
        // Clear cache first
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();

        // Check if test module is discovered
        $this->assertTrue($registry->has('test-module'));
        
        $manifest = $registry->get('test-module');
        $this->assertNotNull($manifest);
        $this->assertEquals('Test Module', $manifest->name);
        $this->assertEquals('1.0.0', $manifest->version);
    }

    /**
     * Test ModuleRegistry returns all modules
     */
    public function test_module_registry_returns_all_modules(): void
    {
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();

        $modules = $registry->all();

        $this->assertGreaterThanOrEqual(1, $modules->count());
        $this->assertTrue($modules->has('test-module'));
    }

    /**
     * Test ModuleRegistry getWithHook method
     */
    public function test_module_registry_get_with_hook(): void
    {
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();

        $modulesWithSidebarHook = $registry->getWithHook('sidebar.menu');

        $this->assertGreaterThanOrEqual(1, $modulesWithSidebarHook->count());
        $this->assertTrue($modulesWithSidebarHook->has('test-module'));
    }

    // ==========================================
    // UserModuleService Tests (Unit-style, no database)
    // ==========================================

    /**
     * Test UserModuleService throws exception for non-existent module
     */
    public function test_user_module_service_throws_for_nonexistent_module(): void
    {
        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;
        
        $service = app(\App\Services\Modules\UserModuleService::class);
        
        $this->expectException(\App\Services\Modules\Exceptions\ModuleAccessException::class);
        
        $service->enable($user, 'nonexistent-module');
    }

    /**
     * Test UserModuleService canAccess for free module
     */
    public function test_user_module_service_can_access_free_module(): void
    {
        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;
        
        $service = app(\App\Services\Modules\UserModuleService::class);
        
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();
        
        // Test module is free, so should be accessible
        $this->assertTrue($service->canAccess($user, 'test-module'));
    }

    /**
     * Test UserModuleService getAccessStatus returns correct info for free module
     */
    public function test_user_module_service_get_access_status_free_module(): void
    {
        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;
        
        $service = app(\App\Services\Modules\UserModuleService::class);
        
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();
        
        $status = $service->getAccessStatus($user, 'test-module');
        
        $this->assertTrue($status['can_access']);
        $this->assertEquals('free', $status['reason']);
        $this->assertFalse($status['is_enabled']);
        $this->assertTrue($status['is_free']);
    }

    /**
     * Test UserModuleService getAccessStatus for non-existent module
     */
    public function test_user_module_service_get_access_status_nonexistent(): void
    {
        $user = new \App\Models\User();
        $user->id = 1;
        
        $service = app(\App\Services\Modules\UserModuleService::class);
        
        $status = $service->getAccessStatus($user, 'nonexistent-module');
        
        $this->assertFalse($status['can_access']);
        $this->assertEquals('not_found', $status['reason']);
    }

    /**
     * Test ModuleAccessException factory methods
     */
    public function test_module_access_exception_factory_methods(): void
    {
        $notFound = \App\Services\Modules\Exceptions\ModuleAccessException::notFound('test');
        $this->assertEquals('not_found', $notFound->getReason());
        $this->assertEquals('test', $notFound->getModuleSlug());

        $disabled = \App\Services\Modules\Exceptions\ModuleAccessException::globallyDisabled('test');
        $this->assertEquals('globally_disabled', $disabled->getReason());

        $planRequired = \App\Services\Modules\Exceptions\ModuleAccessException::planRequired('test', 'pro', 'free');
        $this->assertEquals('plan_required', $planRequired->getReason());
        $this->assertEquals(['required_plan' => 'pro', 'current_plan' => 'free'], $planRequired->getContext());

        $purchaseRequired = \App\Services\Modules\Exceptions\ModuleAccessException::purchaseRequired('test', 100.0);
        $this->assertEquals('purchase_required', $purchaseRequired->getReason());
        $this->assertEquals(['price' => 100.0], $purchaseRequired->getContext());

        $depsMissing = \App\Services\Modules\Exceptions\ModuleAccessException::dependenciesMissing('test', ['dep1', 'dep2']);
        $this->assertEquals('dependencies_missing', $depsMissing->getReason());
        $this->assertEquals(['missing_dependencies' => ['dep1', 'dep2']], $depsMissing->getContext());
    }

    // ==========================================
    // ModuleSettingsService Tests
    // ==========================================

    /**
     * Test ModuleSettingsService can get schema for a module
     */
    public function test_module_settings_service_get_schema(): void
    {
        $service = app(\App\Services\Modules\ModuleSettingsService::class);
        
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();
        
        $schema = $service->getSchema('test-module');
        
        $this->assertIsArray($schema);
        $this->assertArrayHasKey('auto_request', $schema);
        $this->assertEquals('boolean', $schema['auto_request']['type']);
        $this->assertTrue($schema['auto_request']['default']);
    }

    /**
     * Test ModuleSettingsService hasSchemaKey method
     */
    public function test_module_settings_service_has_schema_key(): void
    {
        $service = app(\App\Services\Modules\ModuleSettingsService::class);
        
        $registry = app(ModuleRegistry::class);
        $registry->clearCache();
        $registry->refresh();
        
        $this->assertTrue($service->hasSchemaKey('test-module', 'auto_request'));
        $this->assertTrue($service->hasSchemaKey('test-module', 'request_delay_hours'));
        $this->assertFalse($service->hasSchemaKey('test-module', 'nonexistent_key'));
    }

    /**
     * Test ModuleSettingsService returns empty schema for nonexistent module
     */
    public function test_module_settings_service_empty_schema_for_nonexistent(): void
    {
        $service = app(\App\Services\Modules\ModuleSettingsService::class);
        
        $schema = $service->getSchema('nonexistent-module');
        
        $this->assertIsArray($schema);
        $this->assertEmpty($schema);
    }

    /**
     * Test ModuleSettingsException factory methods
     */
    public function test_module_settings_exception_factory_methods(): void
    {
        $invalidType = \App\Services\Modules\Exceptions\ModuleSettingsException::invalidType('key', 'string', 'integer');
        $this->assertStringContainsString('key', $invalidType->getMessage());
        $this->assertStringContainsString('string', $invalidType->getMessage());
        $this->assertEquals('key', $invalidType->getSettingKey());

        $required = \App\Services\Modules\Exceptions\ModuleSettingsException::required('key');
        $this->assertStringContainsString('required', $required->getMessage());
        $this->assertEquals('key', $required->getSettingKey());

        $belowMin = \App\Services\Modules\Exceptions\ModuleSettingsException::belowMinimum('key', 10, 5);
        $this->assertStringContainsString('at least 10', $belowMin->getMessage());

        $aboveMax = \App\Services\Modules\Exceptions\ModuleSettingsException::aboveMaximum('key', 100, 150);
        $this->assertStringContainsString('at most 100', $aboveMax->getMessage());

        $tooShort = \App\Services\Modules\Exceptions\ModuleSettingsException::tooShort('key', 5, 3);
        $this->assertStringContainsString('at least 5 characters', $tooShort->getMessage());

        $tooLong = \App\Services\Modules\Exceptions\ModuleSettingsException::tooLong('key', 10, 15);
        $this->assertStringContainsString('at most 10 characters', $tooLong->getMessage());

        $multipleErrors = \App\Services\Modules\Exceptions\ModuleSettingsException::multipleValidationErrors('test', ['key1' => 'error1', 'key2' => 'error2']);
        $this->assertStringContainsString('2 validation error', $multipleErrors->getMessage());
        $this->assertCount(2, $multipleErrors->getErrors());
    }

    // ==========================================
    // Middleware Tests
    // ==========================================

    /**
     * Test CheckModuleActive middleware returns 404 for non-existent module
     */
    public function test_check_module_active_middleware_returns_404_for_nonexistent_module(): void
    {
        $middleware = new \App\Http\Middleware\CheckModuleActive(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;

        // Create a mock request
        $request = \Illuminate\Http\Request::create('/api/modules/nonexistent/test', 'GET');
        $request->setUserResolver(fn() => $user);
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'nonexistent-module');

        $this->assertEquals(404, $response->getStatusCode());
    }

    /**
     * Test CheckModuleActive middleware returns 401 for unauthenticated user
     */
    public function test_check_module_active_middleware_returns_401_for_unauthenticated(): void
    {
        $middleware = new \App\Http\Middleware\CheckModuleActive(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock request without user
        $request = \Illuminate\Http\Request::create('/api/modules/test-module/test', 'GET');
        $request->setUserResolver(fn() => null);
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'test-module');

        $this->assertEquals(401, $response->getStatusCode());
    }

    /**
     * Test CheckModuleActive middleware returns 404 for disabled module
     */
    public function test_check_module_active_middleware_returns_404_for_disabled_module(): void
    {
        $middleware = new \App\Http\Middleware\CheckModuleActive(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock user (module not enabled)
        $user = new \App\Models\User();
        $user->id = 999; // User without any enabled modules

        // Create a mock request
        $request = \Illuminate\Http\Request::create('/api/modules/test-module/test', 'GET');
        $request->setUserResolver(fn() => $user);
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'test-module');

        $this->assertEquals(404, $response->getStatusCode());
    }

    /**
     * Test CheckModulePermission middleware returns 401 for unauthenticated user
     */
    public function test_check_module_permission_middleware_returns_401_for_unauthenticated(): void
    {
        $middleware = new \App\Http\Middleware\CheckModulePermission(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock request without user
        $request = \Illuminate\Http\Request::create('/api/modules/test-module/test', 'GET');
        $request->setUserResolver(fn() => null);
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'test-module', 'test.view');

        $this->assertEquals(401, $response->getStatusCode());
    }

    /**
     * Test CheckModulePermission middleware returns 404 for non-existent module
     */
    public function test_check_module_permission_middleware_returns_404_for_nonexistent_module(): void
    {
        $middleware = new \App\Http\Middleware\CheckModulePermission(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;

        // Create a mock request
        $request = \Illuminate\Http\Request::create('/api/modules/nonexistent/test', 'GET');
        $request->setUserResolver(fn() => $user);
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'nonexistent-module', 'test.view');

        $this->assertEquals(404, $response->getStatusCode());
    }

    /**
     * Test CheckModulePermission middleware allows access when no permission specified
     */
    public function test_check_module_permission_middleware_allows_without_permission(): void
    {
        $middleware = new \App\Http\Middleware\CheckModulePermission(
            app(ModuleRegistry::class),
            app(\App\Services\Modules\UserModuleService::class)
        );

        // Create a mock user
        $user = new \App\Models\User();
        $user->id = 1;

        // Create a mock request
        $request = \Illuminate\Http\Request::create('/api/modules/test-module/test', 'GET');
        $request->setUserResolver(fn() => $user);
        $request->headers->set('Accept', 'application/json');

        // No permission specified, should pass through
        $response = $middleware->handle($request, fn($req) => response()->json(['success' => true]), 'test-module');

        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test ModuleServiceProvider registers middleware aliases
     */
    public function test_module_service_provider_registers_middleware_aliases(): void
    {
        $router = app('router');
        
        // Check that middleware aliases are registered
        $middlewareAliases = $router->getMiddleware();
        
        $this->assertArrayHasKey('module.active', $middlewareAliases);
        $this->assertArrayHasKey('module.permission', $middlewareAliases);
        $this->assertEquals(\App\Http\Middleware\CheckModuleActive::class, $middlewareAliases['module.active']);
        $this->assertEquals(\App\Http\Middleware\CheckModulePermission::class, $middlewareAliases['module.permission']);
    }
}