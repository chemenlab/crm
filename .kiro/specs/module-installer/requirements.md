# Requirements Document: Система установки модулей через админку

## Introduction

Система установки модулей позволяет администратору CRM загружать, устанавливать, обновлять и удалять модули через веб-интерфейс админки без необходимости ручного копирования файлов на сервер. Система также включает мастер первоначальной установки CRM для упрощения деплоя на новый сервер.

## Glossary

- **Module_Installer**: Сервис, отвечающий за установку, обновление и удаление модулей
- **Module_Package**: ZIP-архив, содержащий все файлы модуля (backend, frontend, миграции)
- **Installation_Wizard**: Мастер первоначальной установки CRM
- **Module_Registry**: Существующий реестр модулей в системе
- **Admin_Panel**: Административная панель CRM (только для суперадмина)
- **Build_Process**: Процесс компиляции frontend ассетов (npm run build)
- **Migration_Runner**: Компонент для выполнения миграций БД модуля
- **Rollback_Manager**: Компонент для отката изменений при ошибке установки

## Requirements

### Requirement 1: Мастер первоначальной установки CRM

**User Story:** Как владелец сервера, я хочу установить CRM через веб-интерфейс, чтобы не выполнять команды вручную в терминале.

#### Acceptance Criteria

1. WHEN пользователь открывает сайт впервые и файл .env не настроен или БД пуста, THEN Installation_Wizard SHALL отобразить страницу мастера установки
2. WHEN Installation_Wizard запускается, THEN система SHALL проверить наличие PHP 8.1+, Node.js 18+, npm, необходимых PHP расширений и прав на запись в директории
3. WHEN проверка требований не пройдена, THEN Installation_Wizard SHALL отобразить список отсутствующих компонентов с инструкциями по установке
4. WHEN пользователь вводит данные подключения к БД, THEN Installation_Wizard SHALL проверить соединение и отобразить результат
5. WHEN соединение с БД успешно, THEN Installation_Wizard SHALL выполнить все миграции и создать базовую структуру
6. WHEN пользователь заполняет форму создания администратора, THEN Installation_Wizard SHALL создать пользователя с ролью superadmin
7. WHEN установка завершена успешно, THEN Installation_Wizard SHALL записать флаг installed=true в .env и перенаправить на страницу входа
8. IF во время установки происходит ошибка, THEN Installation_Wizard SHALL откатить все изменения и отобразить понятное сообщение об ошибке

### Requirement 2: Структура пакета модуля (Module Package)

**User Story:** Как разработчик модуля, я хочу иметь чёткую структуру пакета, чтобы мои модули корректно устанавливались в систему.

#### Acceptance Criteria

1. THE Module_Package SHALL содержать файл module.json в корне архива с обязательными полями: slug, name, version, description
2. THE Module_Package SHALL содержать директорию backend/ с PHP кодом модуля (Controllers, Models, Services, Routes, Database/Migrations)
3. THE Module_Package MAY содержать директорию frontend/ с React компонентами (hooks, components, pages)
4. THE Module_Package MAY содержать директорию assets/ со статическими файлами (изображения, стили)
5. WHEN module.json содержит поле dependencies, THEN Module_Installer SHALL проверить наличие указанных модулей перед установкой
6. WHEN module.json содержит поле minSystemVersion, THEN Module_Installer SHALL проверить совместимость с версией CRM
7. THE Module_Package SHALL иметь максимальный размер 50MB
8. THE Module_Package SHALL быть валидным ZIP архивом с кодировкой UTF-8

### Requirement 3: Загрузка и валидация пакета модуля

**User Story:** Как администратор, я хочу загружать модули через веб-интерфейс и получать информацию о возможных проблемах до установки.

#### Acceptance Criteria

1. WHEN администратор загружает ZIP файл, THEN Module_Installer SHALL распаковать его во временную директорию
2. WHEN архив распакован, THEN Module_Installer SHALL проверить наличие и валидность module.json
3. WHEN module.json невалиден или отсутствует, THEN Module_Installer SHALL отклонить пакет с понятным сообщением об ошибке
4. WHEN модуль с таким slug уже установлен, THEN Module_Installer SHALL предложить обновление вместо установки
5. WHEN версия загружаемого модуля ниже установленной, THEN Module_Installer SHALL предупредить о даунгрейде и запросить подтверждение
6. WHEN все проверки пройдены, THEN Module_Installer SHALL отобразить информацию о модуле (название, версия, описание, зависимости) и кнопку "Установить"
7. IF архив содержит подозрительные файлы (.php в неожиданных местах, исполняемые файлы), THEN Module_Installer SHALL отклонить пакет с предупреждением о безопасности

### Requirement 4: Процесс установки модуля

**User Story:** Как администратор, я хочу чтобы установка модуля происходила автоматически и безопасно, с возможностью отката при ошибке.

#### Acceptance Criteria

1. WHEN администратор нажимает "Установить", THEN Module_Installer SHALL начать транзакционную установку с возможностью отката
2. WHEN установка начинается, THEN Module_Installer SHALL копировать backend файлы в app/Modules/{slug}/
3. WHEN backend файлы скопированы, THEN Module_Installer SHALL копировать frontend файлы в resources/js/modules/{slug}/
4. WHEN frontend файлы скопированы, THEN Module_Installer SHALL копировать assets в public/modules/{slug}/
5. WHEN файлы скопированы, THEN Module_Installer SHALL выполнить миграции из Database/Migrations/ модуля
6. WHEN миграции выполнены, THEN Module_Installer SHALL запустить npm run build для перекомпиляции frontend
7. WHEN билд завершён, THEN Module_Installer SHALL зарегистрировать модуль в таблице modules с is_active=true
8. WHEN установка завершена успешно, THEN Module_Installer SHALL очистить временные файлы и отобразить сообщение об успехе
9. IF на любом этапе происходит ошибка, THEN Rollback_Manager SHALL откатить все изменения (удалить файлы, откатить миграции) и отобразить ошибку
10. WHILE установка выполняется, THEN Module_Installer SHALL отображать прогресс-бар с текущим этапом

### Requirement 5: Обновление модуля

**User Story:** Как администратор, я хочу обновлять модули до новых версий без потери данных и настроек.

#### Acceptance Criteria

1. WHEN загружается пакет модуля, который уже установлен, THEN Module_Installer SHALL определить это как обновление
2. WHEN обновление начинается, THEN Module_Installer SHALL создать резервную копию текущих файлов модуля
3. WHEN резервная копия создана, THEN Module_Installer SHALL заменить файлы на новые
4. WHEN файлы заменены, THEN Module_Installer SHALL выполнить только новые миграции (которых ещё не было)
5. WHEN миграции выполнены, THEN Module_Installer SHALL запустить npm run build
6. WHEN обновление завершено успешно, THEN Module_Installer SHALL обновить версию в таблице modules
7. IF обновление не удалось, THEN Rollback_Manager SHALL восстановить модуль из резервной копии
8. THE Module_Installer SHALL сохранять настройки пользователей модуля (таблица module_settings) при обновлении

### Requirement 6: Удаление модуля

**User Story:** Как администратор, я хочу полностью удалять модули из системы, включая все их данные.

#### Acceptance Criteria

1. WHEN администратор нажимает "Удалить модуль", THEN Module_Installer SHALL запросить подтверждение с предупреждением о потере данных
2. WHEN удаление подтверждено, THEN Module_Installer SHALL отключить модуль у всех пользователей (user_modules)
3. WHEN модуль отключён, THEN Module_Installer SHALL откатить все миграции модуля (в обратном порядке)
4. WHEN миграции откачены, THEN Module_Installer SHALL удалить файлы из app/Modules/{slug}/
5. WHEN backend удалён, THEN Module_Installer SHALL удалить файлы из resources/js/modules/{slug}/
6. WHEN frontend удалён, THEN Module_Installer SHALL удалить assets из public/modules/{slug}/
7. WHEN файлы удалены, THEN Module_Installer SHALL запустить npm run build
8. WHEN билд завершён, THEN Module_Installer SHALL удалить запись из таблицы modules
9. THE Module_Installer MAY предложить опцию "Сохранить данные" для сохранения таблиц модуля без удаления

### Requirement 7: Интерфейс управления модулями в админке

**User Story:** Как администратор, я хочу удобный интерфейс для управления модулями с полной информацией о каждом модуле.

#### Acceptance Criteria

1. WHEN администратор открывает раздел "Модули" в админке, THEN Admin_Panel SHALL отобразить список всех установленных модулей
2. WHEN отображается список модулей, THEN Admin_Panel SHALL показывать для каждого: название, версию, статус, количество пользователей, дату установки
3. WHEN администратор нажимает на модуль, THEN Admin_Panel SHALL отобразить детальную информацию: описание, зависимости, changelog, статистику использования
4. THE Admin_Panel SHALL предоставить форму загрузки ZIP файла с drag-and-drop поддержкой
5. THE Admin_Panel SHALL отображать прогресс установки/обновления/удаления в реальном времени
6. WHEN происходит ошибка, THEN Admin_Panel SHALL отобразить понятное сообщение с возможными решениями
7. THE Admin_Panel SHALL предоставить возможность включать/отключать модуль глобально (для всех пользователей)
8. THE Admin_Panel SHALL отображать логи установки/обновления/удаления для диагностики проблем

### Requirement 8: Безопасность установки модулей

**User Story:** Как владелец системы, я хочу быть уверен что установка модулей безопасна и не может навредить системе.

#### Acceptance Criteria

1. THE Module_Installer SHALL проверять что ZIP архив не содержит path traversal атак (../)
2. THE Module_Installer SHALL проверять что PHP файлы находятся только в разрешённых директориях (Controllers, Models, Services, Routes, Database)
3. THE Module_Installer SHALL отклонять файлы с опасными расширениями (.exe, .sh, .bat) вне директории assets
4. THE Module_Installer SHALL выполнять установку от имени веб-сервера без повышения привилегий
5. THE Module_Installer SHALL логировать все операции установки/обновления/удаления с IP адресом администратора
6. WHEN модуль содержит ServiceProvider, THEN Module_Installer SHALL проверить что он наследуется от разрешённых базовых классов
7. THE Admin_Panel SHALL быть доступна только пользователям с ролью superadmin
8. THE Module_Installer SHALL создавать резервные копии перед любыми изменениями

### Requirement 9: Управление зависимостями модулей

**User Story:** Как разработчик модуля, я хочу указывать зависимости от других модулей, чтобы система автоматически проверяла их наличие.

#### Acceptance Criteria

1. WHEN module.json содержит dependencies, THEN Module_Installer SHALL проверить что все зависимости установлены
2. WHEN зависимость не установлена, THEN Module_Installer SHALL отобразить список недостающих модулей и отклонить установку
3. WHEN удаляется модуль от которого зависят другие, THEN Module_Installer SHALL предупредить и запросить подтверждение
4. WHEN модуль зависит от конкретной версии другого модуля, THEN Module_Installer SHALL проверить совместимость версий
5. THE Module_Installer SHALL отображать граф зависимостей для каждого модуля

### Requirement 10: Процесс билда frontend

**User Story:** Как администратор, я хочу чтобы frontend модулей компилировался автоматически без моего участия.

#### Acceptance Criteria

1. WHEN требуется билд frontend, THEN Build_Process SHALL выполнить npm run build в фоновом режиме
2. WHILE билд выполняется, THEN Build_Process SHALL отображать вывод консоли в реальном времени
3. WHEN билд завершён успешно, THEN Build_Process SHALL обновить manifest.json и очистить кэш
4. IF билд завершился с ошибкой, THEN Build_Process SHALL отобразить ошибку и предложить повторить
5. THE Build_Process SHALL иметь таймаут 5 минут для предотвращения зависания
6. THE Build_Process SHALL блокировать другие операции с модулями во время выполнения
7. WHEN несколько модулей устанавливаются подряд, THEN Build_Process SHALL выполнить один билд после всех установок (оптимизация)
