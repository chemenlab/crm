# Implementation Plan: Система установки модулей через админку

## Overview

Реализация системы установки модулей через веб-интерфейс админки, включая мастер первоначальной установки CRM, загрузку/валидацию/установку модулей из ZIP-пакетов, управление зависимостями и автоматический билд frontend.

## Tasks

- [ ] 1. Создание базовой инфраструктуры
  - [ ] 1.1 Создать миграции для новых таблиц
    - Таблица `module_installation_logs` для логирования операций
    - Таблица `module_installation_steps` для шагов операций
    - Таблица `module_backups` для резервных копий
    - Таблица `module_migrations` для отслеживания миграций модулей
    - Таблица `installation_settings` для настроек установки
    - _Requirements: 7.8, 8.5_
  - [ ] 1.2 Создать Eloquent модели для новых таблиц
    - ModuleInstallationLog, ModuleInstallationStep, ModuleBackup, ModuleMigration, InstallationSetting
    - _Requirements: 7.8_
  - [ ] 1.3 Создать директории для хранения файлов
    - `storage/module-backups/` для резервных копий
    - `storage/module-temp/` для временных файлов
    - `public/modules/` для статических ассетов модулей
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 2. Реализация сервиса валидации пакетов (ModulePackageValidator)
  - [ ] 2.1 Создать класс ModulePackageValidator
    - Метод `extract()` для распаковки ZIP во временную директорию
    - Метод `validateStructure()` для проверки структуры пакета
    - Метод `parseManifest()` для парсинга module.json
    - Метод `cleanup()` для очистки временных файлов
    - _Requirements: 2.1, 2.2, 2.7, 2.8, 3.1, 3.2_
  - [ ] 2.2 Написать property test для валидации структуры пакета
    - **Property 5: Package Structure Validation**
    - **Validates: Requirements 2.1, 2.2, 2.7, 2.8, 3.2, 3.3**
  - [ ] 2.3 Написать property test для round-trip манифеста
    - **Property 6: Module Manifest Round-Trip**
    - **Validates: Requirements 2.1**

- [ ] 3. Реализация сервиса безопасности (SecurityScannerService)
  - [ ] 3.1 Создать класс SecurityScannerService
    - Метод `checkPathTraversal()` для проверки path traversal атак
    - Метод `validatePhpFileLocations()` для проверки расположения PHP файлов
    - Метод `checkDangerousExtensions()` для проверки опасных расширений
    - Метод `validateServiceProvider()` для проверки наследования ServiceProvider
    - Метод `fullScan()` для полного сканирования пакета
    - _Requirements: 3.7, 8.1, 8.2, 8.3, 8.6_
  - [ ] 3.2 Написать property test для обнаружения угроз безопасности
    - **Property 7: Security Threat Detection**
    - **Validates: Requirements 3.7, 8.1, 8.2, 8.3, 8.6**

- [ ] 4. Реализация сервиса проверки зависимостей (DependencyResolverService)
  - [ ] 4.1 Создать класс DependencyResolverService
    - Метод `checkDependencies()` для проверки наличия зависимостей
    - Метод `checkReverseDependencies()` для проверки зависящих модулей
    - Метод `compareVersions()` для сравнения версий (semver)
    - Метод `buildDependencyGraph()` для построения графа зависимостей
    - _Requirements: 2.5, 2.6, 9.1, 9.2, 9.3, 9.4_
  - [ ] 4.2 Написать property test для разрешения зависимостей
    - **Property 8: Dependency Resolution**
    - **Validates: Requirements 2.5, 9.1, 9.2, 9.4**
  - [ ] 4.3 Написать property test для сравнения версий
    - **Property 10: Version Comparison**
    - **Validates: Requirements 2.6, 3.5, 5.6**

- [ ] 5. Checkpoint - Проверка базовых сервисов
  - Убедиться что все тесты проходят
  - Проверить что валидация пакетов работает корректно
  - Спросить пользователя если есть вопросы

- [ ] 6. Реализация сервиса миграций (MigrationRunnerService)
  - [ ] 6.1 Создать класс MigrationRunnerService
    - Метод `runModuleMigrations()` для выполнения миграций модуля
    - Метод `rollbackModuleMigrations()` для отката миграций
    - Метод `getExecutedMigrations()` для получения выполненных миграций
    - Метод `getPendingMigrations()` для получения pending миграций
    - _Requirements: 4.5, 5.4, 6.3_
  - [ ] 6.2 Написать property test для порядка выполнения миграций
    - **Property 14: Migration Execution Order**
    - **Validates: Requirements 4.5, 6.3**
  - [ ] 6.3 Написать property test для определения pending миграций
    - **Property 15: Pending Migrations Detection**
    - **Validates: Requirements 5.4**

- [ ] 7. Реализация сервиса билда (BuildProcessService)
  - [ ] 7.1 Создать класс BuildProcessService
    - Метод `checkNodeAvailability()` для проверки Node.js и npm
    - Метод `runBuild()` для запуска npm run build
    - Метод `getBuildStatus()` для получения статуса билда
    - Метод `getConsoleOutput()` для получения вывода консоли
    - Метод `clearCache()` для очистки кэша
    - Реализовать таймаут 5 минут и блокировку параллельных операций
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 10.6_
  - [ ] 7.2 Написать property test для таймаута билда
    - **Property 23: Build Process Timeout**
    - **Validates: Requirements 10.5**
  - [ ] 7.3 Написать property test для блокировки операций
    - **Property 24: Build Process Locking**
    - **Validates: Requirements 10.6**

- [ ] 8. Реализация сервиса резервного копирования (RollbackManagerService)
  - [ ] 8.1 Создать класс RollbackManagerService
    - Метод `createCheckpoint()` для создания точки восстановления
    - Метод `rollbackToCheckpoint()` для отката к точке
    - Метод `backupModule()` для создания резервной копии модуля
    - Метод `restoreModule()` для восстановления из резервной копии
    - Метод `cleanupOldBackups()` для очистки старых бэкапов
    - _Requirements: 5.2, 5.7, 8.8_
  - [ ] 8.2 Написать property test для создания бэкапов перед обновлением
    - **Property 19: Backup Creation Before Update**
    - **Validates: Requirements 5.2, 8.8**

- [ ] 9. Checkpoint - Проверка вспомогательных сервисов
  - Убедиться что все тесты проходят
  - Проверить работу миграций, билда и бэкапов
  - Спросить пользователя если есть вопросы

- [ ] 10. Реализация основного сервиса установки (ModuleInstallerService)
  - [ ] 10.1 Создать класс ModuleInstallerService
    - Метод `install()` для установки нового модуля
    - Метод `update()` для обновления существующего модуля
    - Метод `uninstall()` для удаления модуля
    - Метод `getInstallationStatus()` для получения статуса операции
    - Метод `cancelOperation()` для отмены операции
    - Интеграция с PackageValidator, SecurityScanner, DependencyResolver, MigrationRunner, BuildProcess, RollbackManager
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - [ ] 10.2 Написать property test для транзакционности установки
    - **Property 4: Installation Rollback on Error**
    - **Validates: Requirements 1.8, 4.9, 5.7**
  - [ ] 10.3 Написать property test для корректности установки файлов
    - **Property 12: File Installation Correctness**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [ ] 10.4 Написать property test для полноты удаления файлов
    - **Property 13: File Removal Completeness**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  - [ ] 10.5 Написать property test для сохранения настроек при обновлении
    - **Property 20: Settings Preservation on Update**
    - **Validates: Requirements 5.8**

- [ ] 11. Реализация сервиса логирования (InstallationLogService)
  - [ ] 11.1 Создать класс InstallationLogService
    - Метод `createOperation()` для создания записи об операции
    - Метод `addStep()` для добавления шага к операции
    - Метод `completeOperation()` для завершения операции
    - Метод `getModuleLogs()` для получения логов модуля
    - Метод `getRecentOperations()` для получения последних операций
    - _Requirements: 7.8, 8.5_
  - [ ] 11.2 Написать property test для логирования операций
    - **Property 21: Operation Logging**
    - **Validates: Requirements 8.5**

- [ ] 12. Checkpoint - Проверка основных сервисов
  - Убедиться что все тесты проходят
  - Протестировать полный цикл установки модуля
  - Спросить пользователя если есть вопросы

- [ ] 13. Реализация API контроллеров для управления модулями
  - [ ] 13.1 Создать AdminModuleController
    - `index()` - список установленных модулей
    - `upload()` - загрузка ZIP пакета
    - `install()` - установка модуля
    - `update()` - обновление модуля
    - `destroy()` - удаление модуля
    - `toggle()` - включение/отключение модуля
    - `logs()` - логи операций модуля
    - _Requirements: 7.1, 7.2, 7.3, 7.7, 7.8_
  - [ ] 13.2 Создать AdminModuleOperationController
    - `status()` - статус операции (SSE для real-time)
    - `cancel()` - отмена операции
    - _Requirements: 4.10, 7.5_
  - [ ] 13.3 Добавить middleware для проверки доступа superadmin
    - _Requirements: 8.7_
  - [ ] 13.4 Написать property test для контроля доступа
    - **Property 22: Admin Access Control**
    - **Validates: Requirements 8.7**

- [ ] 14. Реализация мастера установки CRM (InstallationWizardService)
  - [ ] 14.1 Создать класс InstallationWizardService
    - Метод `isInstalled()` для проверки установки CRM
    - Метод `checkRequirements()` для проверки системных требований
    - Метод `testDatabaseConnection()` для теста подключения к БД
    - Метод `writeEnvConfig()` для записи конфигурации в .env
    - Метод `runMigrations()` для выполнения миграций
    - Метод `createAdministrator()` для создания администратора
    - Метод `completeInstallation()` для завершения установки
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  - [ ] 14.2 Написать property test для определения статуса установки
    - **Property 1: Installation Status Detection**
    - **Validates: Requirements 1.1**
  - [ ] 14.3 Написать property test для проверки требований
    - **Property 2: Requirements Check Completeness**
    - **Validates: Requirements 1.2, 1.3**
  - [ ] 14.4 Написать property test для валидации подключения к БД
    - **Property 3: Database Connection Validation**
    - **Validates: Requirements 1.4**

- [ ] 15. Реализация API контроллеров для мастера установки
  - [ ] 15.1 Создать InstallController
    - `checkRequirements()` - проверка системных требований
    - `testDatabase()` - тест подключения к БД
    - `configure()` - запись конфигурации
    - `runMigrations()` - выполнение миграций
    - `createAdmin()` - создание администратора
    - `complete()` - завершение установки
    - `status()` - статус установки
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ] 15.2 Создать middleware для проверки что CRM не установлена
    - Блокировать доступ к мастеру если CRM уже установлена
    - _Requirements: 1.1_

- [ ] 16. Checkpoint - Проверка backend
  - Убедиться что все тесты проходят
  - Протестировать API endpoints через Postman/curl
  - Спросить пользователя если есть вопросы

- [ ] 17. Реализация frontend компонентов для мастера установки
  - [ ] 17.1 Создать страницу InstallationWizard
    - Шаг Welcome с приветствием
    - Шаг Requirements с проверкой требований
    - Шаг Database с формой подключения к БД
    - Шаг Admin с формой создания администратора
    - Шаг Complete с сообщением об успехе
    - Использовать shadcn/ui компоненты (Card, Button, Input, Progress, Badge, Alert)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ] 17.2 Добавить роут для мастера установки
    - Роут `/install` доступен только если CRM не установлена
    - _Requirements: 1.1_

- [ ] 18. Реализация frontend компонентов для управления модулями
  - [ ] 18.1 Создать компонент ModuleUploader
    - Drag-and-drop зона для загрузки ZIP
    - Отображение прогресса загрузки
    - Отображение результатов валидации
    - Использовать react-dropzone и shadcn/ui
    - _Requirements: 7.4_
  - [ ] 18.2 Создать компонент ModuleInstallDialog
    - Отображение информации о модуле
    - Кнопки подтверждения/отмены
    - Прогресс установки в реальном времени
    - Использовать shadcn/ui Dialog, Progress, Badge
    - _Requirements: 3.6, 4.10, 7.5_
  - [ ] 18.3 Создать компонент InstallationProgress
    - Отображение шагов установки
    - Консольный вывод билда
    - Кнопка отмены
    - Использовать SSE для real-time обновлений
    - _Requirements: 4.10, 7.5, 10.2_

- [ ] 19. Реализация страницы управления модулями в админке
  - [ ] 19.1 Создать страницу ModuleManagerPage
    - Таблица установленных модулей
    - Кнопка загрузки нового модуля
    - Фильтры и поиск
    - Использовать shadcn/ui Table, Badge, Button, Switch
    - _Requirements: 7.1, 7.2, 7.7_
  - [ ] 19.2 Создать компонент ModuleDetailsSheet
    - Детальная информация о модуле
    - Вкладки: Обзор, Зависимости, Логи
    - Кнопки обновления/удаления
    - Использовать shadcn/ui Sheet, Tabs
    - _Requirements: 7.3_
  - [ ] 19.3 Создать компонент UninstallConfirmDialog
    - Предупреждение о потере данных
    - Чекбокс "Сохранить данные"
    - Использовать shadcn/ui AlertDialog, Checkbox
    - _Requirements: 6.1, 6.9_
  - [ ] 19.4 Создать компонент InstallationLogsTable
    - Таблица логов операций
    - Фильтры по типу и статусу
    - Детали операции в модальном окне
    - Использовать shadcn/ui Table, Badge
    - _Requirements: 7.8_

- [ ] 20. Checkpoint - Проверка frontend
  - Убедиться что все компоненты работают
  - Протестировать UI в браузере
  - Спросить пользователя если есть вопросы

- [ ] 21. Интеграция и финальные доработки
  - [ ] 21.1 Добавить роуты в админку
    - `/admin/modules` - страница управления модулями
    - `/admin/modules/{slug}` - детали модуля
    - _Requirements: 7.1_
  - [ ] 21.2 Добавить пункт меню в сайдбар админки
    - Иконка и название "Модули"
    - _Requirements: 7.1_
  - [ ] 21.3 Создать cron job для очистки старых бэкапов
    - Команда `php artisan modules:cleanup-backups`
    - Запуск ежедневно
    - _Requirements: 8.8_
  - [ ] 21.4 Создать cron job для очистки временных файлов
    - Команда `php artisan modules:cleanup-temp`
    - Запуск каждый час
    - _Requirements: 4.8_

- [ ] 22. Финальный checkpoint
  - Убедиться что все тесты проходят
  - Протестировать полный цикл: установка CRM → загрузка модуля → установка → обновление → удаление
  - Спросить пользователя если есть вопросы

## Notes

- Все задачи включая property-based тесты являются обязательными
- Каждая задача ссылается на конкретные требования для traceability
- Checkpoints позволяют проверить прогресс и получить обратную связь
- Property tests используют PHPUnit с пакетом `eris/eris` для PHP
- Frontend тесты можно добавить позже с использованием Vitest + Testing Library
