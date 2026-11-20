BEGIN;
SELECT plan(15);

INSERT INTO auth.users (id, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'calendar-owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'calendar-other@example.com');

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.calendar_events$$,
  '42501', null, 'anon cannot read calendar events'
);
SELECT throws_ok(
  $$INSERT INTO public.calendar_events (user_id,title,starts_at,ends_at)
    VALUES ('11111111-1111-1111-1111-111111111111','Anon event','2026-11-20 09:00+00','2026-11-20 10:00+00')$$,
  '42501', null, 'anon cannot create calendar events'
);
SELECT throws_ok(
  $$UPDATE public.calendar_events SET title = 'Anon edit'$$,
  '42501', null, 'anon cannot update calendar events'
);
SELECT throws_ok(
  $$DELETE FROM public.calendar_events$$,
  '42501', null, 'anon cannot delete calendar events'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT results_eq(
  $$INSERT INTO public.calendar_events (user_id,title,starts_at,ends_at)
    VALUES ('11111111-1111-1111-1111-111111111111','Owner event','2026-11-20 09:00+00','2026-11-20 10:00+00')
    RETURNING title$$,
  ARRAY['Owner event'],
  'the owner creates their calendar event'
);
SELECT results_eq(
  $$SELECT title FROM public.calendar_events WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY['Owner event'],
  'the owner reads their calendar event'
);
SELECT results_eq(
  $$UPDATE public.calendar_events SET description = 'Updated details'
    WHERE user_id = '11111111-1111-1111-1111-111111111111' RETURNING description$$,
  ARRAY['Updated details'],
  'the owner updates their calendar event'
);
SELECT throws_ok(
  $$UPDATE public.calendar_events SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'the owner cannot transfer the event to another user'
);

SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SELECT throws_ok(
  $$INSERT INTO public.calendar_events (user_id,title,starts_at,ends_at)
    VALUES ('11111111-1111-1111-1111-111111111111','Impersonated event','2026-11-20 11:00+00','2026-11-20 12:00+00')$$,
  '42501', null, 'another user cannot create an event for the owner'
);
SELECT is_empty(
  $$SELECT * FROM public.calendar_events WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'another user reads no owner events'
);
SELECT is_empty(
  $$UPDATE public.calendar_events SET title = 'Changed by another user' RETURNING title$$,
  'another user cannot update the owner event'
);
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT results_eq(
  $$SELECT title FROM public.calendar_events WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY['Owner event'],
  'the denied update leaves the event unchanged'
);
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SELECT is_empty(
  $$DELETE FROM public.calendar_events RETURNING title$$,
  'another user cannot delete the owner event'
);
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT results_eq(
  $$SELECT title FROM public.calendar_events WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY['Owner event'],
  'the denied delete leaves the event unchanged'
);
SELECT results_eq(
  $$DELETE FROM public.calendar_events WHERE user_id = '11111111-1111-1111-1111-111111111111' RETURNING title$$,
  ARRAY['Owner event'],
  'the owner deletes their calendar event'
);

SELECT * FROM finish();
ROLLBACK;
