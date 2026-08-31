INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false) ON CONFLICT (id) DO NOTHING;
