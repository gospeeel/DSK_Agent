-- Полная демонстрационная картина для локальной разработки.
-- Seed идемпотентен: записи в зарезервированном диапазоне ID обновляются при повторном запуске.
-- Все демонстрационные аккаунты используют пароль: Demo123!

BEGIN;

INSERT INTO users (id, name, email, password_hash, role, budget_max, preferences) VALUES
    (1001, 'Елена Соколова', 'supervisor@dsk.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'supervisor', NULL, '{}'::jsonb),
    (1002, 'Михаил Петров', 'manager@dsk.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'manager', NULL, '{}'::jsonb),
    (1003, 'Анна Белова', 'manager2@dsk.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'manager', NULL, '{}'::jsonb),
    (1101, 'Анна Смирнова', 'anna.smirnova@example.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'user', 9200000, '{"rooms":2,"district":"Коминтерновский","parking_required":true}'::jsonb),
    (1102, 'Дмитрий Орлов', 'dmitry.orlov@example.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'user', 7600000, '{"rooms":1,"finishing":"turnkey"}'::jsonb),
    (1103, 'Ольга Кузнецова', 'olga.kuznetsova@example.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'user', 13500000, '{"rooms":3,"floor_min":8,"storage_required":true}'::jsonb),
    (1104, 'Сергей Волков', 'sergey.volkov@example.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'user', 6800000, '{"rooms":1,"district":"Левобережный"}'::jsonb),
    (1105, 'Мария Лебедева', 'maria.lebedeva@example.demo', '$2a$10$yvWiRVYYE6BbkVZmz3EFM.7g.90jRc6c9TWMP5pnRUVGuQNo42fNe', 'user', 10400000, '{"rooms":2,"purchase_timeline":"до конца года"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role, budget_max = EXCLUDED.budget_max, preferences = EXCLUDED.preferences;

INSERT INTO residential_complexes (id, name, address, description) VALUES
    (2001, 'Квартал «Северный»', 'Воронеж, Московский проспект, 126', 'Семейный квартал с закрытыми дворами и подземным паркингом.'),
    (2002, 'ЖК «Левобережный»', 'Воронеж, Ленинский проспект, 215', 'Проект у водохранилища с готовой социальной инфраструктурой.'),
    (2003, 'ЖК «Горизонт»', 'Воронеж, ул. Шишкова, 142', 'Новый проект ДСК на стадии проектирования.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, description = EXCLUDED.description;

INSERT INTO buildings (
    id, residential_complex_id, address, district, latitude, longitude, floors_count,
    planned_date, actual_date, status, type_wall_material,
    readiness_percent, forecast_date, delivery_shift_days
) VALUES
    (2101, 2001, 'Корпус 2', 'Коминтерновский', 51.70510000, 39.16820000, 17, CURRENT_DATE + 210, NULL, 'construction', 'panel', 68, CURRENT_DATE + 219, 9),
    (2102, 2001, 'Корпус 3', 'Коминтерновский', 51.70600000, 39.16910000, 20, CURRENT_DATE + 420, NULL, 'construction', 'monolith', 34, CURRENT_DATE + 420, 0),
    (2103, 2002, 'Дом 1', 'Левобережный', 51.66090000, 39.28010000, 16, CURRENT_DATE - 90, CURRENT_DATE - 82, 'completed', 'brick', 100, CURRENT_DATE - 82, 8),
    (2104, 2003, 'Корпус 1', 'Центральный', 51.69250000, 39.20510000, 24, CURRENT_DATE + 720, NULL, 'design', 'block', 4, CURRENT_DATE + 720, 0),
    (2105, 2002, 'Дом 2', 'Левобережный', 51.66170000, 39.28100000, 18, CURRENT_DATE + 330, NULL, 'suspended', 'panel', 41, CURRENT_DATE + 375, 45)
ON CONFLICT (id) DO UPDATE SET
    residential_complex_id = EXCLUDED.residential_complex_id, address = EXCLUDED.address,
    district = EXCLUDED.district, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
    floors_count = EXCLUDED.floors_count, planned_date = EXCLUDED.planned_date,
    actual_date = EXCLUDED.actual_date, status = EXCLUDED.status,
    type_wall_material = EXCLUDED.type_wall_material, readiness_percent = EXCLUDED.readiness_percent,
    forecast_date = EXCLUDED.forecast_date, delivery_shift_days = EXCLUDED.delivery_shift_days;

INSERT INTO apartments (id, building_id, number, rooms, floor, area, price, type_finishing, status) VALUES
    (3001, 2101, '181', 2, 10, 62.10, 8950000, 'white_box', 'booked'),
    (3002, 2101, '182', 1, 10, 41.60, 6430000, 'turnkey', 'free'),
    (3003, 2101, '183', 3, 10, 78.40, 11250000, 'rough', 'sold'),
    (3004, 2101, '184', 2, 10, 59.20, 8470000, 'white_box', 'free'),
    (3005, 2101, '185', 1, 10, 38.70, 5980000, 'rough', 'free'),
    (3006, 2101, '186', 2, 10, 64.80, 9180000, 'turnkey', 'booked'),
    (3011, 2101, '127', 1, 7, 39.10, 6120000, 'rough', 'free'),
    (3012, 2101, '128', 3, 7, 81.30, 11860000, 'turnkey', 'free'),
    (3021, 2102, '74', 2, 5, 57.90, 8040000, 'white_box', 'free'),
    (3022, 2102, '75', 3, 5, 84.20, 12190000, 'rough', 'booked'),
    (3031, 2103, '46', 1, 3, 42.30, 6770000, 'turnkey', 'sold'),
    (3041, 2104, '201', 2, 12, 61.70, 9230000, 'white_box', 'free'),
    (3051, 2105, '91', 2, 6, 60.40, 7980000, 'rough', 'free')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, number = EXCLUDED.number, rooms = EXCLUDED.rooms,
    floor = EXCLUDED.floor, area = EXCLUDED.area, price = EXCLUDED.price,
    type_finishing = EXCLUDED.type_finishing, status = EXCLUDED.status;

INSERT INTO construction_progress (
    id, building_id, stage_name, planned_start_date, actual_start_date,
    planned_end_date, actual_end_date, status, completion_percentage,
    delay_reason, risk_level, delay_days
) VALUES
    (4001, 2101, 'excavation', CURRENT_DATE - 420, CURRENT_DATE - 420, CURRENT_DATE - 380, CURRENT_DATE - 378, 'completed', 100, NULL, 'low', 0),
    (4002, 2101, 'foundation', CURRENT_DATE - 378, CURRENT_DATE - 376, CURRENT_DATE - 300, CURRENT_DATE - 294, 'completed', 100, NULL, 'low', 0),
    (4003, 2101, 'frame', CURRENT_DATE - 292, CURRENT_DATE - 292, CURRENT_DATE - 80, CURRENT_DATE - 72, 'completed', 100, NULL, 'medium', 8),
    (4004, 2101, 'roofing', CURRENT_DATE - 70, CURRENT_DATE - 68, CURRENT_DATE + 15, NULL, 'delayed', 74, 'Задержка поставки дверных блоков', 'high', 9),
    (4005, 2101, 'finishing', CURRENT_DATE + 5, NULL, CURRENT_DATE + 170, NULL, 'not_started', 0, NULL, 'medium', 0),
    (4011, 2102, 'excavation', CURRENT_DATE - 160, CURRENT_DATE - 160, CURRENT_DATE - 110, CURRENT_DATE - 108, 'completed', 100, NULL, 'low', 0),
    (4012, 2102, 'foundation', CURRENT_DATE - 108, CURRENT_DATE - 106, CURRENT_DATE - 30, NULL, 'in_progress', 82, NULL, 'low', 0),
    (4021, 2103, 'finishing', CURRENT_DATE - 240, CURRENT_DATE - 238, CURRENT_DATE - 110, CURRENT_DATE - 90, 'completed', 100, NULL, 'low', 0),
    (4031, 2104, 'excavation', CURRENT_DATE + 210, NULL, CURRENT_DATE + 270, NULL, 'not_started', 0, NULL, 'low', 0),
    (4041, 2105, 'frame', CURRENT_DATE - 190, CURRENT_DATE - 188, CURRENT_DATE - 20, NULL, 'delayed', 46, 'Работы приостановлены до корректировки проекта', 'high', 45)
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, stage_name = EXCLUDED.stage_name,
    planned_start_date = EXCLUDED.planned_start_date, actual_start_date = EXCLUDED.actual_start_date,
    planned_end_date = EXCLUDED.planned_end_date, actual_end_date = EXCLUDED.actual_end_date,
    status = EXCLUDED.status, completion_percentage = EXCLUDED.completion_percentage,
    delay_reason = EXCLUDED.delay_reason, risk_level = EXCLUDED.risk_level, delay_days = EXCLUDED.delay_days;

INSERT INTO ancillary_units (id, building_id, kind, number, area, price, status) VALUES
    (8001, 2101, 'parking', 'P-041', 13.50, 1250000, 'free'),
    (8002, 2101, 'parking', 'P-042', 13.50, 1250000, 'booked'),
    (8003, 2101, 'storage', 'K-018', 4.80, 480000, 'free'),
    (8004, 2101, 'storage', 'K-019', 5.20, 530000, 'sold'),
    (8011, 2102, 'parking', 'P-101', 14.10, 1390000, 'free'),
    (8012, 2102, 'storage', 'K-051', 6.00, 610000, 'booked')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, kind = EXCLUDED.kind, number = EXCLUDED.number,
    area = EXCLUDED.area, price = EXCLUDED.price, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP;

INSERT INTO chat_sessions (
    id, id_user, id_employee, id_apartment, guest_name, guest_email, guest_phone,
    status, created_at, updated_at
) VALUES
    (5001, 1101, NULL, 3004, NULL, NULL, NULL, 'open', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
    (5002, 1101, 1002, 3001, NULL, NULL, NULL, 'in_progress', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '18 minutes'),
    (5003, 1102, 1002, 3002, NULL, NULL, NULL, 'close', CURRENT_TIMESTAMP - INTERVAL '34 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    (5004, 1103, 1003, 3012, NULL, NULL, NULL, 'in_progress', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (5005, NULL, NULL, 3021, 'Алексей Морозов', 'alexey.guest@example.demo', '+7 900 555-21-10', 'open', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (5006, 1104, 1002, 3051, NULL, NULL, NULL, 'close', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
    (5007, 1105, 1002, 3006, NULL, NULL, NULL, 'in_progress', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '12 minutes')
ON CONFLICT (id) DO UPDATE SET
    id_user = EXCLUDED.id_user, id_employee = EXCLUDED.id_employee,
    id_apartment = EXCLUDED.id_apartment, guest_name = EXCLUDED.guest_name,
    guest_email = EXCLUDED.guest_email, guest_phone = EXCLUDED.guest_phone,
    status = EXCLUDED.status, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

INSERT INTO messages (id, id_chat_session, id_user, sender_type, content, is_read, sended_at) VALUES
    (5101, 5002, 1101, 'client', 'Нужна двухкомнатная квартира до 9,2 млн рублей и место в паркинге.', TRUE, CURRENT_TIMESTAMP - INTERVAL '11 days'),
    (5102, 5002, 1002, 'manager', 'Подобрал вариант в корпусе 2. Уточняю актуальный срок и допустимую скидку.', TRUE, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (5103, 5002, NULL, 'system', 'По корпусу зафиксирован риск смещения срока на 9 дней.', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (5104, 5002, 1101, 'client', 'Конкурент обещает сдать раньше. Какие у нас гарантии?', FALSE, CURRENT_TIMESTAMP - INTERVAL '18 minutes'),
    (5105, 5003, 1102, 'client', 'Готов перейти к договору, если квартира будет с отделкой.', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    (5106, 5003, 1002, 'manager', 'Подтверждаю отделку под ключ и направляю согласованное предложение.', TRUE, CURRENT_TIMESTAMP - INTERVAL '29 days'),
    (5107, 5004, 1103, 'client', 'Нужна трёхкомнатная квартира повыше и отдельная кладовая.', TRUE, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (5108, 5004, NULL, 'ai', 'Внутренняя рекомендация: сравнить стоимость метра и предложить кладовую как отдельную позицию.', TRUE, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (5109, 5004, 1003, 'manager', 'Подготовлю расчёт по квартире №128 и кладовой.', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (5110, 5007, 1105, 'client', 'Можно ли получить скидку 7%?', FALSE, CURRENT_TIMESTAMP - INTERVAL '12 minutes')
ON CONFLICT (id) DO UPDATE SET
    id_chat_session = EXCLUDED.id_chat_session, id_user = EXCLUDED.id_user,
    sender_type = EXCLUDED.sender_type, content = EXCLUDED.content,
    is_read = EXCLUDED.is_read, sended_at = EXCLUDED.sended_at;

INSERT INTO chat_session_rejections (id, id_chat_sessions, id_employee, reason, created_at) VALUES
    (5201, 5006, 1002, 'Клиент отложил покупку из-за приостановки работ по объекту.', CURRENT_TIMESTAMP - INTERVAL '20 days')
ON CONFLICT (id) DO UPDATE SET
    id_chat_sessions = EXCLUDED.id_chat_sessions, id_employee = EXCLUDED.id_employee,
    reason = EXCLUDED.reason, created_at = EXCLUDED.created_at;

INSERT INTO deals (
    id, id_user, id_employee, id_apartment, id_chat_session,
    base_price, percent_discount, total_price, status, created_at, updated_at
) VALUES
    (6001, 1101, 1002, 3001, 5002, 8950000, 4.00, 8592000, 'pending', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (6002, 1102, 1002, 3002, 5003, 6430000, 5.00, 6108500, 'contract', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (6003, 1103, 1003, 3003, 5004, 11250000, 3.50, 10856250, 'completed', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP - INTERVAL '35 days'),
    (6004, 1104, 1002, 3051, 5006, 7980000, 0.00, 7980000, 'cancelled', CURRENT_TIMESTAMP - INTERVAL '48 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
    (6005, 1105, 1002, 3006, 5007, 9180000, 7.00, 8537400, 'pending', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '12 minutes')
ON CONFLICT (id) DO UPDATE SET
    id_user = EXCLUDED.id_user, id_employee = EXCLUDED.id_employee,
    id_apartment = EXCLUDED.id_apartment, id_chat_session = EXCLUDED.id_chat_session,
    base_price = EXCLUDED.base_price, percent_discount = EXCLUDED.percent_discount,
    total_price = EXCLUDED.total_price, status = EXCLUDED.status,
    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

INSERT INTO discount_policies (
    id, building_id, role, max_discount_percent, version,
    valid_from, valid_to, created_by, created_at
) VALUES
    (8101, 2101, 'manager', 4.00, 1, CURRENT_TIMESTAMP - INTERVAL '180 days', CURRENT_TIMESTAMP - INTERVAL '30 days', 1001, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    (8102, 2101, 'manager', 5.00, 2, CURRENT_TIMESTAMP - INTERVAL '30 days', NULL, 1001, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    (8103, 2101, 'supervisor', 12.00, 1, CURRENT_TIMESTAMP - INTERVAL '180 days', NULL, 1001, CURRENT_TIMESTAMP - INTERVAL '180 days'),
    (8111, 2102, 'manager', 4.50, 1, CURRENT_TIMESTAMP - INTERVAL '90 days', NULL, 1001, CURRENT_TIMESTAMP - INTERVAL '90 days'),
    (8112, 2102, 'supervisor', 10.00, 1, CURRENT_TIMESTAMP - INTERVAL '90 days', NULL, 1001, CURRENT_TIMESTAMP - INTERVAL '90 days')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, role = EXCLUDED.role,
    max_discount_percent = EXCLUDED.max_discount_percent, version = EXCLUDED.version,
    valid_from = EXCLUDED.valid_from, valid_to = EXCLUDED.valid_to,
    created_by = EXCLUDED.created_by, created_at = EXCLUDED.created_at;

INSERT INTO offers (
    id, deal_id, version, created_by, base_price, discount_percent, final_price,
    generated_text, status, approval_required, approved_by, approved_at,
    rejected_by, rejected_at, rejection_reason, request_id,
    parking_unit_id, parking_price, storage_unit_id, storage_price, created_at, updated_at
) VALUES
    (7001, 6001, 1, 1002, 8950000, 3.00, 8681500, 'Первичная версия предложения для Анны Смирновой.', 'draft', FALSE, NULL, NULL, NULL, NULL, NULL, 'demo-offer-6001-v1', NULL, 0, NULL, 0, CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    (7002, 6001, 2, 1002, 10200000, 4.00, 9792000, 'Квартира №181 и парковочное место P-041. Срок указан с учётом текущего риска.', 'approved', FALSE, 1001, CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL, NULL, 'demo-offer-6001-v2', 8001, 1250000, NULL, 0, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (7003, 6002, 1, 1002, 6430000, 5.00, 6108500, 'Согласованное предложение по квартире №182 с отделкой под ключ.', 'approved', FALSE, 1001, CURRENT_TIMESTAMP - INTERVAL '25 days', NULL, NULL, NULL, 'demo-offer-6002-v1', NULL, 0, NULL, 0, CURRENT_TIMESTAMP - INTERVAL '27 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
    (7004, 6003, 1, 1003, 11860000, 3.50, 11444900, 'Проект предложения по квартире №128 и кладовой.', 'draft', FALSE, NULL, NULL, NULL, NULL, NULL, 'demo-offer-6003-v1', NULL, 0, 8003, 480000, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    (7005, 6004, 1, 1002, 7980000, 8.00, 7341600, 'Запрошена скидка выше лимита менеджера.', 'rejected', TRUE, NULL, NULL, 1001, CURRENT_TIMESTAMP - INTERVAL '19 days', 'Риск объекта не позволяет подтверждать запрошенные условия.', 'demo-offer-6004-v1', NULL, 0, NULL, 0, CURRENT_TIMESTAMP - INTERVAL '22 days', CURRENT_TIMESTAMP - INTERVAL '19 days'),
    (7006, 6005, 1, 1002, 9180000, 7.00, 8537400, 'КП ожидает решения руководителя по скидке 7%.', 'pending_approval', TRUE, NULL, NULL, NULL, NULL, NULL, 'demo-offer-6005-v1', NULL, 0, NULL, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours')
ON CONFLICT (id) DO UPDATE SET
    deal_id = EXCLUDED.deal_id, version = EXCLUDED.version, created_by = EXCLUDED.created_by,
    base_price = EXCLUDED.base_price, discount_percent = EXCLUDED.discount_percent,
    final_price = EXCLUDED.final_price, generated_text = EXCLUDED.generated_text,
    status = EXCLUDED.status, approval_required = EXCLUDED.approval_required,
    approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at,
    rejected_by = EXCLUDED.rejected_by, rejected_at = EXCLUDED.rejected_at,
    rejection_reason = EXCLUDED.rejection_reason, request_id = EXCLUDED.request_id,
    parking_unit_id = EXCLUDED.parking_unit_id, parking_price = EXCLUDED.parking_price,
    storage_unit_id = EXCLUDED.storage_unit_id, storage_price = EXCLUDED.storage_price,
    created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at;

INSERT INTO competitors (
    id, project_name, district, price_per_sqm, advantages, disadvantages,
    source_url, observed_at, updated_at, rooms, area
) VALUES
    (9001, 'ЖК «Поколение»', 'Коминтерновский', 151000, 'Готовая отделка, благоустроенный двор', 'Выше стоимость парковки', 'https://example.demo/pokolenie', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 2, 61.40),
    (9002, 'ЖК «Новый квартал»', 'Коминтерновский', 146500, 'Близость к школе', 'Срок сдачи позже корпуса ДСК', 'https://example.demo/new-quarter', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 1, 42.00),
    (9003, 'ЖК «Берег»', 'Левобережный', 137800, 'Вид на водохранилище', 'Ограниченная транспортная доступность', 'https://example.demo/bereg', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days', 3, 82.70)
ON CONFLICT (id) DO UPDATE SET
    project_name = EXCLUDED.project_name, district = EXCLUDED.district,
    price_per_sqm = EXCLUDED.price_per_sqm, advantages = EXCLUDED.advantages,
    disadvantages = EXCLUDED.disadvantages, source_url = EXCLUDED.source_url,
    observed_at = EXCLUDED.observed_at, updated_at = EXCLUDED.updated_at,
    rooms = EXCLUDED.rooms, area = EXCLUDED.area;

INSERT INTO recommendations (id, deal_id, kind, recommendation, request_id, created_at) VALUES
    (9101, 6001, 'objection', 'Сопоставить срок конкурента с подтверждённым прогнозом ДСК и не называть точную дату до зелёного статуса.', 'demo-rec-6001-objection', CURRENT_TIMESTAMP - INTERVAL '17 minutes'),
    (9102, 6001, 'next_action', 'Позвонить клиенту до 12:30 и предложить резервный вариант в корпусе 3.', 'demo-rec-6001-action', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    (9103, 6005, 'discount', 'Дождаться решения руководителя; не обещать скидку 7% до согласования.', 'demo-rec-6005-discount', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET
    deal_id = EXCLUDED.deal_id, kind = EXCLUDED.kind,
    recommendation = EXCLUDED.recommendation, request_id = EXCLUDED.request_id,
    created_at = EXCLUDED.created_at;

INSERT INTO notifications (
    id, user_id, deal_id, type, title, message, is_read, created_at, read_at
) VALUES
    (9201, 1101, 6001, 'construction_delay', 'Изменение срока по корпусу 2', 'Прогнозный срок смещён на 9 дней. Менеджер подготовит обновлённую информацию.', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL),
    (9202, 1105, 6005, 'construction_risk', 'Риск поставки дверных блоков', 'Риск принят в работу. Подтверждённая дата будет сообщена после обновления графика.', FALSE, CURRENT_TIMESTAMP - INTERVAL '3 hours', NULL),
    (9203, 1102, 6002, 'deal_update', 'Договор подготовлен', 'Ваш менеджер завершил подготовку документов по сделке.', TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (9204, 1103, 6003, 'general', 'Добро пожаловать в личный кабинет', 'Здесь сохраняются предложения, сделки и сообщения менеджера.', TRUE, CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP - INTERVAL '99 days')
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id, deal_id = EXCLUDED.deal_id, type = EXCLUDED.type,
    title = EXCLUDED.title, message = EXCLUDED.message, is_read = EXCLUDED.is_read,
    created_at = EXCLUDED.created_at, read_at = EXCLUDED.read_at;

INSERT INTO construction_notification_state (progress_id, fingerprint, updated_at) VALUES
    (4004, 'demo:roofing:delayed:high:9', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (4041, 'demo:frame:delayed:high:45', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (progress_id) DO UPDATE SET fingerprint = EXCLUDED.fingerprint, updated_at = EXCLUDED.updated_at;

INSERT INTO erp_events (
    id, building_id, kind, title, details, severity, affects_delivery, delay_days, occurred_at
) VALUES
    (9301, 2101, 'supply', 'Поставка дверных блоков перенесена', 'Поставщик подтвердил новую дату отгрузки через 9 дней.', 'high', TRUE, 9, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
    (9302, 2101, 'material', 'Остаток утеплителя ниже минимума', 'Требуется пополнение для непрерывной работы второй бригады.', 'medium', FALSE, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (9303, 2102, 'schedule', 'Монтаж секции Б идёт по графику', 'Фактическая выработка соответствует недельному плану.', 'low', FALSE, 0, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
    (9304, 2105, 'project_change', 'Корректировка входной группы', 'Проектная документация направлена на повторное согласование.', 'high', TRUE, 45, CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, kind = EXCLUDED.kind, title = EXCLUDED.title,
    details = EXCLUDED.details, severity = EXCLUDED.severity,
    affects_delivery = EXCLUDED.affects_delivery, delay_days = EXCLUDED.delay_days,
    occurred_at = EXCLUDED.occurred_at;

INSERT INTO material_stocks (
    id, building_id, material_name, quantity, unit, minimum_quantity, updated_at
) VALUES
    (9401, 2101, 'Дверные блоки', 18, 'шт.', 64, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (9402, 2101, 'Утеплитель фасадный', 42.500, 'м³', 55, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (9403, 2101, 'Сухая смесь', 128.000, 'т', 40, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (9404, 2102, 'Панели ЖБИ', 96, 'шт.', 72, CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, material_name = EXCLUDED.material_name,
    quantity = EXCLUDED.quantity, unit = EXCLUDED.unit,
    minimum_quantity = EXCLUDED.minimum_quantity, updated_at = EXCLUDED.updated_at;

INSERT INTO production_schedules (
    id, building_id, product_name, planned_quantity, produced_quantity,
    planned_date, status, updated_at
) VALUES
    (9501, 2101, 'Внутренние стеновые панели', 120, 120, CURRENT_DATE - 14, 'completed', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    (9502, 2101, 'Лестничные марши', 24, 18, CURRENT_DATE + 3, 'in_progress', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (9503, 2101, 'Дверные блоки', 64, 18, CURRENT_DATE - 2, 'delayed', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (9504, 2102, 'Плиты перекрытий', 180, 0, CURRENT_DATE + 21, 'planned', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
    building_id = EXCLUDED.building_id, product_name = EXCLUDED.product_name,
    planned_quantity = EXCLUDED.planned_quantity, produced_quantity = EXCLUDED.produced_quantity,
    planned_date = EXCLUDED.planned_date, status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

INSERT INTO ai_audit_log (
    id, actor_id, deal_id, chat_session_id, action, request_text,
    response_text, agent, intent, status, created_at
) VALUES
    (9601, 1002, 6001, 5002, 'dialog_analyze', 'Проанализировать переписку и выделить подтверждённые потребности.', 'Бюджет до 9,2 млн; две комнаты; требуется парковка; возражение по сроку.', 'analytics', 'analyze_dialog', 'success', CURRENT_TIMESTAMP - INTERVAL '16 minutes'),
    (9602, 1002, 6001, 5002, 'reply_assist', 'Подготовить ответ на возражение о сроках.', 'Не обещать точную дату; сообщить подтверждённый диапазон и следующий контрольный срок.', 'negotiation', 'timing_objection', 'success', CURRENT_TIMESTAMP - INTERVAL '14 minutes'),
    (9603, 1003, 6003, 5004, 'offer_generate', 'Сформировать КП с кладовой.', NULL, 'offer', 'create_offer', 'failed', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
    actor_id = EXCLUDED.actor_id, deal_id = EXCLUDED.deal_id,
    chat_session_id = EXCLUDED.chat_session_id, action = EXCLUDED.action,
    request_text = EXCLUDED.request_text, response_text = EXCLUDED.response_text,
    agent = EXCLUDED.agent, intent = EXCLUDED.intent, status = EXCLUDED.status,
    created_at = EXCLUDED.created_at;

INSERT INTO staff_reminders (
    id, assigned_to, created_by, deal_id, title, due_at, completed_at, created_at
) VALUES
    (9701, 1002, 1002, 6001, 'Сообщить Анне об изменении графика', CURRENT_TIMESTAMP + INTERVAL '2 hours', NULL, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (9702, 1002, 1001, 6005, 'Уточнить обоснование скидки 7%', CURRENT_TIMESTAMP + INTERVAL '5 hours', NULL, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (9703, 1003, 1003, 6003, 'Подготовить подборку кладовых', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (9704, 1002, 1001, 6002, 'Проверить комплект договора', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '8 days')
ON CONFLICT (id) DO UPDATE SET
    assigned_to = EXCLUDED.assigned_to, created_by = EXCLUDED.created_by,
    deal_id = EXCLUDED.deal_id, title = EXCLUDED.title, due_at = EXCLUDED.due_at,
    completed_at = EXCLUDED.completed_at, created_at = EXCLUDED.created_at;

INSERT INTO offer_documents (
    id, offer_id, content, content_type, checksum_sha256, generated_at
) VALUES
    (9801, 7002, convert_to('%PDF-1.4 demo commercial offer', 'UTF8'), 'application/pdf', repeat('a', 64), CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (9802, 7003, convert_to('%PDF-1.4 demo commercial offer', 'UTF8'), 'application/pdf', repeat('b', 64), CURRENT_TIMESTAMP - INTERVAL '25 days')
ON CONFLICT (id) DO UPDATE SET
    offer_id = EXCLUDED.offer_id, content = EXCLUDED.content,
    content_type = EXCLUDED.content_type, checksum_sha256 = EXCLUDED.checksum_sha256,
    generated_at = EXCLUDED.generated_at;

INSERT INTO offer_deliveries (
    id, offer_id, recipient, channel, status, error_message, created_at, sent_at
) VALUES
    (9901, 7002, 'anna.smirnova@example.demo', 'email', 'sent', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 minute'),
    (9902, 7003, 'dmitry.orlov@example.demo', 'email', 'failed', 'SMTP недоступен в демонстрационном окружении', CURRENT_TIMESTAMP - INTERVAL '24 days', NULL),
    (9903, 7003, 'dmitry.orlov@example.demo', 'email', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes', NULL)
ON CONFLICT (id) DO UPDATE SET
    offer_id = EXCLUDED.offer_id, recipient = EXCLUDED.recipient,
    channel = EXCLUDED.channel, status = EXCLUDED.status,
    error_message = EXCLUDED.error_message, created_at = EXCLUDED.created_at,
    sent_at = EXCLUDED.sent_at;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), TRUE);
SELECT setval(pg_get_serial_sequence('residential_complexes', 'id'), COALESCE((SELECT MAX(id) FROM residential_complexes), 1), TRUE);
SELECT setval(pg_get_serial_sequence('buildings', 'id'), COALESCE((SELECT MAX(id) FROM buildings), 1), TRUE);
SELECT setval(pg_get_serial_sequence('apartments', 'id'), COALESCE((SELECT MAX(id) FROM apartments), 1), TRUE);
SELECT setval(pg_get_serial_sequence('construction_progress', 'id'), COALESCE((SELECT MAX(id) FROM construction_progress), 1), TRUE);
SELECT setval(pg_get_serial_sequence('chat_sessions', 'id'), COALESCE((SELECT MAX(id) FROM chat_sessions), 1), TRUE);
SELECT setval(pg_get_serial_sequence('chat_session_rejections', 'id'), COALESCE((SELECT MAX(id) FROM chat_session_rejections), 1), TRUE);
SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE((SELECT MAX(id) FROM messages), 1), TRUE);
SELECT setval(pg_get_serial_sequence('deals', 'id'), COALESCE((SELECT MAX(id) FROM deals), 1), TRUE);
SELECT setval(pg_get_serial_sequence('offers', 'id'), COALESCE((SELECT MAX(id) FROM offers), 1), TRUE);
SELECT setval(pg_get_serial_sequence('discount_policies', 'id'), COALESCE((SELECT MAX(id) FROM discount_policies), 1), TRUE);
SELECT setval(pg_get_serial_sequence('ancillary_units', 'id'), COALESCE((SELECT MAX(id) FROM ancillary_units), 1), TRUE);
SELECT setval(pg_get_serial_sequence('competitors', 'id'), COALESCE((SELECT MAX(id) FROM competitors), 1), TRUE);
SELECT setval(pg_get_serial_sequence('recommendations', 'id'), COALESCE((SELECT MAX(id) FROM recommendations), 1), TRUE);
SELECT setval(pg_get_serial_sequence('notifications', 'id'), COALESCE((SELECT MAX(id) FROM notifications), 1), TRUE);
SELECT setval(pg_get_serial_sequence('erp_events', 'id'), COALESCE((SELECT MAX(id) FROM erp_events), 1), TRUE);
SELECT setval(pg_get_serial_sequence('material_stocks', 'id'), COALESCE((SELECT MAX(id) FROM material_stocks), 1), TRUE);
SELECT setval(pg_get_serial_sequence('production_schedules', 'id'), COALESCE((SELECT MAX(id) FROM production_schedules), 1), TRUE);
SELECT setval(pg_get_serial_sequence('ai_audit_log', 'id'), COALESCE((SELECT MAX(id) FROM ai_audit_log), 1), TRUE);
SELECT setval(pg_get_serial_sequence('staff_reminders', 'id'), COALESCE((SELECT MAX(id) FROM staff_reminders), 1), TRUE);
SELECT setval(pg_get_serial_sequence('offer_documents', 'id'), COALESCE((SELECT MAX(id) FROM offer_documents), 1), TRUE);
SELECT setval(pg_get_serial_sequence('offer_deliveries', 'id'), COALESCE((SELECT MAX(id) FROM offer_deliveries), 1), TRUE);

COMMIT;
