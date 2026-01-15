-- Melhorar sistema de prestadores
-- Executar diretamente no Supabase

-- 1. Melhorar tabela de profiles com campos específicos para prestadores
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_experience_years INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_hourly_rate DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_availability TEXT DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_rejection_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_application_date TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de especialidades do prestador
CREATE TABLE IF NOT EXISTS provider_specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_name TEXT NOT NULL,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, specialty_name)
);

-- 3. Criar tabela de portfolio do prestador
CREATE TABLE IF NOT EXISTS provider_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  technologies TEXT[], -- Array de tecnologias usadas
  completion_date DATE,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de disponibilidade do prestador
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week, start_time)
);

-- 5. Criar tabela de estatísticas do prestador
CREATE TABLE IF NOT EXISTS provider_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_gigs_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  repeat_client_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_provider_specialties_provider_id ON provider_specialties(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_provider_id ON provider_portfolio(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_stats_provider_id ON provider_stats(provider_id);

-- 7. Habilitar RLS
ALTER TABLE provider_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_stats ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS
-- Provider Specialties
CREATE POLICY "Users can view all provider specialties" ON provider_specialties FOR SELECT USING (true);
CREATE POLICY "Providers can manage their own specialties" ON provider_specialties FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all specialties" ON provider_specialties FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Provider Portfolio
CREATE POLICY "Users can view all provider portfolios" ON provider_portfolio FOR SELECT USING (true);
CREATE POLICY "Providers can manage their own portfolio" ON provider_portfolio FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all portfolios" ON provider_portfolio FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Provider Availability
CREATE POLICY "Users can view provider availability" ON provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage their own availability" ON provider_availability FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all availability" ON provider_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Provider Stats
CREATE POLICY "Users can view provider stats" ON provider_stats FOR SELECT USING (true);
CREATE POLICY "Providers can view their own stats" ON provider_stats FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "System can update stats" ON provider_stats FOR ALL USING (true);

-- 9. Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_provider_portfolio_updated_at BEFORE UPDATE ON provider_portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Criar função para inicializar stats do prestador
CREATE OR REPLACE FUNCTION initialize_provider_stats(provider_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO provider_stats (provider_id)
  VALUES (provider_uuid)
  ON CONFLICT (provider_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Criar função para atualizar stats do prestador
CREATE OR REPLACE FUNCTION update_provider_stats(provider_uuid UUID)
RETURNS VOID AS $$
DECLARE
  completed_gigs INTEGER;
  total_earned DECIMAL(12,2);
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Contar gigs completados
  SELECT COUNT(*) INTO completed_gigs
  FROM gigs 
  WHERE provider_id = provider_uuid AND status = 'completed';
  
  -- Calcular ganhos totais
  SELECT COALESCE(SUM(price), 0) INTO total_earned
  FROM gigs 
  WHERE provider_id = provider_uuid AND status = 'completed';
  
  -- Calcular rating médio
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, review_count
  FROM reviews 
  WHERE provider_id = provider_uuid;
  
  -- Atualizar stats
  UPDATE provider_stats SET
    total_gigs_completed = completed_gigs,
    total_earnings = total_earned,
    average_rating = avg_rating,
    total_reviews = review_count,
    last_updated = NOW()
  WHERE provider_id = provider_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Inserir dados de exemplo para disponibilidade padrão
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time)
SELECT 
  id as provider_id,
  generate_series(1, 5) as day_of_week, -- Segunda a Sexta
  '09:00'::TIME as start_time,
  '18:00'::TIME as end_time
FROM profiles 
WHERE is_provider = true AND provider_status = 'approved'
ON CONFLICT DO NOTHING;

-- 13. Inicializar stats para prestadores existentes
INSERT INTO provider_stats (provider_id)
SELECT id FROM profiles WHERE is_provider = true
ON CONFLICT DO NOTHING;

COMMIT;
