-- Default warning thresholds — editable by Admin in Settings UI at any time.
-- These rows are DATA, not code: nothing in the app hard-codes "30/15/7/3/1".

insert into notification_settings (module, label, offset_value, offset_unit, is_active) values
  ('equipment', '30 ngày', 30, 'day', true),
  ('equipment', '15 ngày', 15, 'day', true),
  ('equipment', '7 ngày',   7, 'day', true),
  ('equipment', '3 ngày',   3, 'day', true),
  ('equipment', '1 ngày',   1, 'day', true),

  ('audit', '14 ngày', 14, 'day', true),
  ('audit', '7 ngày',   7, 'day', true),
  ('audit', '3 ngày',   3, 'day', true),
  ('audit', '1 ngày',   1, 'day', true),

  ('announcement', '7 ngày',   7,  'day',    true),
  ('announcement', '1 ngày',   1,  'day',    true),
  ('announcement', '1 giờ',    1,  'hour',   true),
  ('announcement', '30 phút', 30,  'minute', true);
