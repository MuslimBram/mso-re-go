-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Place suggestions table
CREATE TABLE public.place_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  place_query text NOT NULL,
  comment text,
  contact text,
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.place_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can submit
CREATE POLICY "Anyone can insert suggestions" ON public.place_suggestions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(place_query) BETWEEN 1 AND 500
    AND (name IS NULL OR char_length(name) <= 100)
    AND (comment IS NULL OR char_length(comment) <= 2000)
    AND (contact IS NULL OR char_length(contact) <= 200)
  );

-- Only admin can read or delete
CREATE POLICY "Admins view suggestions" ON public.place_suggestions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete suggestions" ON public.place_suggestions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
