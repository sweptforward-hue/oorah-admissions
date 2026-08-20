-- Upsert master admin user manually for testing/development
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'Azrielcohenca@gmail.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, email, name, role, active)
SELECT id, email, 'Azriel Cohenca', 'admin', true
FROM auth.users
WHERE email = 'Azrielcohenca@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', active = true;
