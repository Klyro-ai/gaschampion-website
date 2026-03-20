-- Seed Gas Champion as first client
INSERT OR IGNORE INTO clients (id, business_name, telegram_chat_id, timezone, pages_project_name, r2_bucket_prefix, google_place_id)
VALUES (
  'gc-001',
  'Gas Champion Ltd',
  'PLACEHOLDER_CHAT_ID',
  'Europe/London',
  'gaschampion-website',
  'gc-001/',
  'PLACEHOLDER_PLACE_ID'
);

-- Seed existing hardcoded reviews from business.ts
INSERT OR IGNORE INTO reviews (id, client_id, source, author_name, rating, text, review_date, status, source_id)
VALUES
  ('rev-001', 'gc-001', 'google', 'Sarah M.', 5, 'Absolutely brilliant service! Lee came out same day when our boiler broke down. Very professional and explained everything clearly. Highly recommend!', '2024-01-15', 'approved', 'seed-1'),
  ('rev-002', 'gc-001', 'google', 'James K.', 5, 'Had our annual boiler service done by Gas Champion. Lee was punctual, thorough and very friendly. Great value for money too.', '2024-02-20', 'approved', 'seed-2'),
  ('rev-003', 'gc-001', 'google', 'Emma T.', 5, 'Lee installed our new Worcester boiler. The whole process was seamless from quote to installation. 10 year warranty and the house has never been warmer!', '2024-03-10', 'approved', 'seed-3'),
  ('rev-004', 'gc-001', 'google', 'David R.', 5, 'Needed a gas safety certificate for our rental property. Lee was very accommodating with timing and the certificate was emailed same day. Will use again.', '2023-11-05', 'approved', 'seed-4'),
  ('rev-005', 'gc-001', 'google', 'Lisa P.', 5, 'Our radiators were cold at the bottom. Lee did a powerflush and they''re like new! Should have done it years ago. Very fair price.', '2024-04-18', 'approved', 'seed-5'),
  ('rev-006', 'gc-001', 'google', 'Tom W.', 5, 'Fantastic service from start to finish. Lee fitted a Nest thermostat and showed us how to use it properly. Already saving on our energy bills!', '2024-05-22', 'approved', 'seed-6'),
  ('rev-007', 'gc-001', 'google', 'Rachel H.', 5, 'Called Lee in a panic when we smelled gas. He came within the hour, found the issue and fixed it. Can''t thank him enough. True professional.', '2024-06-30', 'approved', 'seed-7'),
  ('rev-008', 'gc-001', 'mybuilder', 'Mark & Sue B.', 5, 'Lee has serviced our boiler for 3 years now. Always reliable, always on time. We recommend Gas Champion to all our friends and family.', '2024-07-14', 'approved', 'seed-8'),
  ('rev-009', 'gc-001', 'mybuilder', 'Angela C.', 5, 'Needed 3 new radiators fitted in our extension. Lee gave the best quote and did a beautiful job. Clean, tidy and professional throughout.', '2024-08-25', 'approved', 'seed-9'),
  ('rev-010', 'gc-001', 'google', 'Phil D.', 5, 'Gas Champion fixed a leak under our kitchen sink that two other plumbers couldn''t sort. Lee diagnosed it in minutes. Absolute legend!', '2024-09-12', 'approved', 'seed-10');
