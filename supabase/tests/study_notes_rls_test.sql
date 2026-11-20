BEGIN;
SELECT plan(15);

INSERT INTO auth.users (id, email)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'notes-owner@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'notes-other@example.com');

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.study_notes$$,
  '42501', null, 'anon cannot read study notes'
);
SELECT throws_ok(
  $$INSERT INTO public.study_notes (user_id,title,content)
    VALUES ('33333333-3333-3333-3333-333333333333','Anon note','Private text')$$,
  '42501', null, 'anon cannot create study notes'
);
SELECT throws_ok(
  $$UPDATE public.study_notes SET title = 'Anon edit'$$,
  '42501', null, 'anon cannot update study notes'
);
SELECT throws_ok(
  $$DELETE FROM public.study_notes$$,
  '42501', null, 'anon cannot delete study notes'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SELECT results_eq(
  $$INSERT INTO public.study_notes (user_id,title,content)
    VALUES ('33333333-3333-3333-3333-333333333333','Owner note','My private note')
    RETURNING title$$,
  ARRAY['Owner note'],
  'the owner creates their note'
);
SELECT results_eq(
  $$SELECT content FROM public.study_notes WHERE user_id = '33333333-3333-3333-3333-333333333333'$$,
  ARRAY['My private note'],
  'the owner reads their note'
);
SELECT results_eq(
  $$UPDATE public.study_notes SET content = 'Updated private note'
    WHERE user_id = '33333333-3333-3333-3333-333333333333' RETURNING content$$,
  ARRAY['Updated private note'],
  'the owner updates their note'
);
SELECT throws_ok(
  $$UPDATE public.study_notes SET user_id = '44444444-4444-4444-4444-444444444444'
    WHERE user_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501', null, 'the owner cannot transfer the note to another user'
);

SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
SELECT throws_ok(
  $$INSERT INTO public.study_notes (user_id,title,content)
    VALUES ('33333333-3333-3333-3333-333333333333','Impersonated note','Private text')$$,
  '42501', null, 'another user cannot create a note for the owner'
);
SELECT is_empty(
  $$SELECT * FROM public.study_notes WHERE user_id = '33333333-3333-3333-3333-333333333333'$$,
  'another user reads no owner notes'
);
SELECT is_empty(
  $$UPDATE public.study_notes SET content = 'Changed by another user' RETURNING content$$,
  'another user cannot update the owner note'
);
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SELECT results_eq(
  $$SELECT content FROM public.study_notes WHERE user_id = '33333333-3333-3333-3333-333333333333'$$,
  ARRAY['Updated private note'],
  'the denied update leaves the note unchanged'
);
SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
SELECT is_empty(
  $$DELETE FROM public.study_notes RETURNING content$$,
  'another user cannot delete the owner note'
);
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SELECT results_eq(
  $$SELECT content FROM public.study_notes WHERE user_id = '33333333-3333-3333-3333-333333333333'$$,
  ARRAY['Updated private note'],
  'the denied delete leaves the note unchanged'
);
SELECT results_eq(
  $$DELETE FROM public.study_notes WHERE user_id = '33333333-3333-3333-3333-333333333333' RETURNING content$$,
  ARRAY['Updated private note'],
  'the owner deletes their note'
);

SELECT * FROM finish();
ROLLBACK;
