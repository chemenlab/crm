# Requirements Document: Onboarding System Improvements

## Introduction

Улучшение существующей системы онбординга MasterPlan CRM путем добавления контекстных подсказок на все страницы, автоматического отслеживания прогресса и создания базы знаний для пользователей.

## Glossary

- **System**: MasterPlan CRM - система управления записями для мастеров
- **User**: Мастер, использующий CRM систему
- **Hint**: Контекстная подсказка, отображаемая на странице
- **Onboarding_Progress**: Прогресс прохождения онбординга пользователем
- **Step**: Шаг онбординга (profile_setup, first_service, first_client, etc.)
- **Knowledge_Base**: База знаний с статьями и инструкциями
- **Tour**: Интерактивный тур по системе (уже реализован)

## Requirements

### Requirement 1: Контекстные подсказки на всех страницах

**User Story:** Как новый пользователь, я хочу видеть полезные подсказки на каждой странице, чтобы быстрее освоить функционал системы.

#### Acceptance Criteria

1. WHEN User посещает страницу Calendar AND User не имеет записей, THEN THE System SHALL отобразить подсказку "Создайте первую запись"
2. WHEN User посещает страницу Finance AND User не имеет транзакций, THEN THE System SHALL отобразить подсказку "Отслеживайте доходы и расходы"
3. WHEN User посещает страницу Settings/Profile AND User не загрузил аватар, THEN THE System SHALL отобразить подсказку "Добавьте фото профиля"
4. WHEN User посещает страницу Settings/Schedule AND User не настроил рабочие дни, THEN THE System SHALL отобразить подсказку "Настройте рабочий график"
5. WHEN User посещает страницу Settings/Notifications AND User не настроил уведомления, THEN THE System SHALL отобразить подсказку "Настройте уведомления для клиентов"
6. WHEN User закрывает подсказку, THEN THE System SHALL сохранить информацию о просмотре в базу данных
7. WHEN User повторно посещает страницу, THEN THE System SHALL не показывать ранее закрытые подсказки

### Requirement 2: Автоматическое отслеживание прогресса

**User Story:** Как пользователь, я хочу чтобы система автоматически отмечала выполненные шаги онбординга, чтобы не делать это вручную.

#### Acceptance Criteria

1. WHEN User создает первую услугу, THEN THE System SHALL автоматически отметить шаг "first_service" как выполненный
2. WHEN User создает первого клиента, THEN THE System SHALL автоматически отметить шаг "first_client" как выполненный
3. WHEN User создает первую запись, THEN THE System SHALL автоматически отметить шаг "first_appointment" как выполненный
4. WHEN User настраивает хотя бы один рабочий день в расписании, THEN THE System SHALL автоматически отметить шаг "schedule_setup" как выполненный
5. WHEN User обновляет настройки публичной страницы (slug, site_title, или site_description), THEN THE System SHALL автоматически отметить шаг "public_page_setup" как выполненный
6. WHEN User обновляет настройки уведомлений, THEN THE System SHALL автоматически отметить шаг "notification_setup" как выполненный
7. WHEN User завершает онбординг при регистрации, THEN THE System SHALL автоматически отметить шаг "profile_setup" как выполненный
8. WHEN все шаги отмечены как выполненные, THEN THE System SHALL установить флаг is_completed в true

### Requirement 3: Улучшенные подсказки с типами

**User Story:** Как пользователь, я хочу видеть разные типы подсказок (информационные, советы, предупреждения), чтобы лучше понимать их важность.

#### Acceptance Criteria

1. WHEN подсказка имеет тип "info", THEN THE System SHALL отобразить её с синим фоном и иконкой Lightbulb
2. WHEN подсказка имеет тип "tip", THEN THE System SHALL отобразить её с желтым фоном и иконкой Lightbulb
3. WHEN подсказка имеет тип "warning", THEN THE System SHALL отобразить её с оранжевым фоном и иконкой Lightbulb
4. WHEN подсказка имеет параметр dismissible=true, THEN THE System SHALL отобразить кнопку закрытия
5. WHEN подсказка имеет параметр autoHide=true, THEN THE System SHALL автоматически скрыть её через указанное время
6. FOR ALL подсказок, THE System SHALL проверять список просмотренных подсказок перед отображением

### Requirement 4: База знаний (опционально)

**User Story:** Как пользователь, я хочу иметь доступ к базе знаний с инструкциями, чтобы самостоятельно находить ответы на вопросы.

#### Acceptance Criteria

1. WHEN User переходит на страницу /app/help, THEN THE System SHALL отобразить главную страницу базы знаний
2. WHEN User просматривает базу знаний, THEN THE System SHALL отобразить категории статей (Начало работы, Записи, Клиенты, Финансы, Настройки)
3. WHEN User вводит запрос в поиск, THEN THE System SHALL отобразить релевантные статьи
4. WHEN User открывает статью, THEN THE System SHALL отобразить содержимое в формате Markdown
5. WHERE статья содержит видео-инструкцию, THE System SHALL встроить YouTube видео
6. WHEN User просматривает статью, THEN THE System SHALL отобразить навигацию по разделам статьи
7. WHEN User завершает чтение статьи, THE System SHALL предложить похожие статьи

### Requirement 5: Интеграция с существующими контроллерами

**User Story:** Как разработчик, я хочу чтобы отслеживание прогресса было интегрировано в существующие контроллеры, чтобы не дублировать код.

#### Acceptance Criteria

1. WHEN ServiceController создает услугу, THEN THE System SHALL вызвать метод отслеживания прогресса
2. WHEN ClientController создает клиента, THEN THE System SHALL вызвать метод отслеживания прогресса
3. WHEN AppointmentController создает запись, THEN THE System SHALL вызвать метод отслеживания прогресса
4. WHEN SettingsController обновляет расписание, THEN THE System SHALL вызвать метод отслеживания прогресса
5. WHEN SettingsController обновляет публичную страницу, THEN THE System SHALL вызвать метод отслеживания прогресса
6. WHEN SettingsController обновляет уведомления, THEN THE System SHALL вызвать метод отслеживания прогресса
7. FOR ALL вызовов отслеживания, THE System SHALL обрабатывать ошибки без прерывания основного процесса

### Requirement 6: Условное отображение подсказок

**User Story:** Как пользователь, я хочу видеть подсказки только когда они актуальны, чтобы не загромождать интерфейс.

#### Acceptance Criteria

1. WHEN User имеет хотя бы одну услугу, THEN THE System SHALL не показывать подсказку "Создайте первую услугу"
2. WHEN User имеет хотя бы одного клиента, THEN THE System SHALL не показывать подсказку "Добавьте первого клиента"
3. WHEN User имеет хотя бы одну запись, THEN THE System SHALL не показывать подсказку "Создайте первую запись"
4. WHEN User имеет хотя бы одно фото в портфолио, THEN THE System SHALL не показывать подсказку "Загрузите фото работ"
5. WHEN User настроил хотя бы один рабочий день, THEN THE System SHALL не показывать подсказку "Настройте рабочий график"
6. WHEN User загрузил аватар, THEN THE System SHALL не показывать подсказку "Добавьте фото профиля"
7. FOR ALL подсказок, THE System SHALL проверять актуальность перед отображением

### Requirement 7: Прогресс-бар с детальной информацией

**User Story:** Как пользователь, я хочу видеть детальный прогресс онбординга, чтобы понимать что осталось сделать.

#### Acceptance Criteria

1. WHEN User просматривает прогресс-бар, THEN THE System SHALL отобразить процент выполнения (X из 7 шагов)
2. WHEN User просматривает прогресс-бар, THEN THE System SHALL отобразить список всех шагов с галочками
3. WHEN шаг выполнен, THEN THE System SHALL отобразить зеленую галочку рядом с названием шага
4. WHEN шаг не выполнен, THEN THE System SHALL отобразить серый кружок рядом с названием шага
5. WHEN User нажимает "Начать заново", THEN THE System SHALL сбросить весь прогресс онбординга
6. WHEN User нажимает "Скрыть", THEN THE System SHALL скрыть прогресс-бар до следующего входа
7. WHEN все шаги выполнены, THEN THE System SHALL автоматически скрыть прогресс-бар

### Requirement 8: Уведомления о достижениях

**User Story:** Как пользователь, я хочу получать уведомления о выполнении шагов онбординга, чтобы чувствовать прогресс.

#### Acceptance Criteria

1. WHEN User выполняет шаг онбординга, THEN THE System SHALL отобразить toast уведомление "Шаг выполнен!"
2. WHEN User выполняет последний шаг, THEN THE System SHALL отобразить поздравительное уведомление
3. WHEN User завершает весь онбординг, THEN THE System SHALL отобразить модальное окно с поздравлением
4. WHERE модальное окно отображается, THE System SHALL предложить поделиться достижением
5. WHEN уведомление отображается, THEN THE System SHALL автоматически скрыть его через 5 секунд
6. FOR ALL уведомлений, THE System SHALL использовать компонент toast из shadcn/ui
7. FOR ALL уведомлений, THE System SHALL отображать их в правом верхнем углу экрана

### Requirement 9: Статистика онбординга для администратора

**User Story:** Как администратор, я хочу видеть статистику прохождения онбординга пользователями, чтобы понимать где возникают проблемы.

#### Acceptance Criteria

1. WHEN администратор открывает админ-панель, THEN THE System SHALL отобразить общую статистику онбординга
2. WHEN администратор просматривает статистику, THEN THE System SHALL отобразить процент пользователей, завершивших онбординг
3. WHEN администратор просматривает статистику, THEN THE System SHALL отобразить среднее время прохождения онбординга
4. WHEN администратор просматривает статистику, THEN THE System SHALL отобразить самые проблемные шаги (где пользователи застревают)
5. WHEN администратор просматривает статистику, THEN THE System SHALL отобразить список пользователей, не завершивших онбординг
6. WHERE администратор просматривает пользователя, THE System SHALL отобразить его прогресс по шагам
7. FOR ALL статистики, THE System SHALL обновлять данные в реальном времени

### Requirement 10: Экспорт статей базы знаний

**User Story:** Как администратор, я хочу иметь возможность добавлять и редактировать статьи базы знаний, чтобы поддерживать актуальность информации.

#### Acceptance Criteria

1. WHEN администратор создает статью, THEN THE System SHALL сохранить её в формате Markdown
2. WHEN администратор редактирует статью, THEN THE System SHALL сохранить изменения с версионированием
3. WHEN администратор публикует статью, THEN THE System SHALL сделать её доступной для пользователей
4. WHEN администратор удаляет статью, THEN THE System SHALL переместить её в архив (soft delete)
5. WHERE статья содержит изображения, THE System SHALL загрузить их в storage
6. WHERE статья содержит видео, THE System SHALL сохранить ссылку на YouTube
7. FOR ALL статей, THE System SHALL поддерживать категоризацию и теги
