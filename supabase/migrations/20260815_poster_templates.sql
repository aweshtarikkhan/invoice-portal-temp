CREATE TABLE IF NOT EXISTS public.poster_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    festival_name text NOT NULL,
    bg_image_url text,
    bg_gradient text,
    theme_color text,
    default_text text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Note: This table is public and acts as a global gallery of templates available to all organizations.
ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users on poster_templates" 
    ON public.poster_templates FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Insert predefined templates
INSERT INTO public.poster_templates (name, festival_name, bg_image_url, bg_gradient, theme_color, default_text)
VALUES
('Diwali Glow', 'Diwali', 'https://images.unsplash.com/photo-1572003818138-199efa9e46a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-orange-900 to-amber-950', 'text-amber-400', 'Wishing you and your family a very Happy & Prosperous Diwali! May the festival of lights brighten your life with joy and success.'),
('Holi Colors', 'Holi', 'https://images.unsplash.com/photo-1551699932-d85c545366be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-fuchsia-900 to-pink-900', 'text-pink-300', 'Happy Holi! May your life be filled with vibrant colors of happiness, love, and success.'),
('Dussehra Victory', 'Dussehra', 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-amber-600 to-red-700', 'text-yellow-300', 'Happy Dussehra! May the truth always win and good triumph over evil. Wishing you prosperity and joy.'),
('Navratri Nights', 'Navratri', 'https://images.unsplash.com/photo-1664161839556-9d8bdfdf37cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-purple-900 to-indigo-950', 'text-fuchsia-400', 'Happy Navratri! May Goddess Durga bless you with strength, wisdom, and courage to overcome all obstacles.'),
('Raksha Bandhan Bond', 'Raksha Bandhan', 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-rose-500 to-red-800', 'text-rose-100', 'Happy Raksha Bandhan! Celebrating the eternal bond of love and protection. Wishing you joy and prosperity.'),
('Ganesh Chaturthi Blessings', 'Ganesh Chaturthi', 'https://images.unsplash.com/photo-1567115855018-c0bdf0591572?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-orange-500 to-amber-700', 'text-orange-100', 'Happy Ganesh Chaturthi! May Lord Ganesha remove all obstacles and bring success and happiness to your life.'),
('Eid Mubarak', 'Eid', 'https://images.unsplash.com/photo-1594950965380-0a259c1c50e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-emerald-800 to-teal-950', 'text-emerald-300', 'Eid Mubarak! May this special day bring peace, happiness, and prosperity to you and your loved ones.'),
('Independence Day Pride', 'Independence Day', 'https://images.unsplash.com/photo-1628103009477-764956a9e144?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-orange-500 via-white to-green-600', 'text-blue-900', 'Happy Independence Day! Let us salute the nation and remember the sacrifices of our freedom fighters.'),
('Republic Day Spirit', 'Republic Day', 'https://images.unsplash.com/photo-1579227114347-15d08fc37cae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-orange-600 via-gray-100 to-green-700', 'text-blue-800', 'Happy Republic Day! Celebrating the spirit of India and the constitution that guides our great nation.'),
('Makar Sankranti Kites', 'Makar Sankranti', 'https://images.unsplash.com/photo-1611082596489-0820066a56e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'from-yellow-400 to-orange-500', 'text-yellow-900', 'Happy Makar Sankranti! May your life fly high like a kite and bring you abundant joy and success.')
ON CONFLICT DO NOTHING;
