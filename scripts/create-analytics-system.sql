-- Criar tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  
  -- Propriedades do evento
  properties JSONB DEFAULT '{}',
  
  -- Contexto
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Geolocalização
  country TEXT,
  city TEXT,
  
  -- Dispositivo
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de métricas diárias
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  
  -- Usuários
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- Gigs
  gigs_created INTEGER DEFAULT 0,
  gigs_approved INTEGER DEFAULT 0,
  gigs_completed INTEGER DEFAULT 0,
  
  -- Propostas
  proposals_sent INTEGER DEFAULT 0,
  proposals_accepted INTEGER DEFAULT 0,
  
  -- Pagamentos
  total_revenue NUMERIC(12,2) DEFAULT 0,
  platform_revenue NUMERIC(12,2) DEFAULT 0,
  transactions_count INTEGER DEFAULT 0,
  
  -- Reviews
  reviews_created INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  
  -- Engajamento
  page_views INTEGER DEFAULT 0,
  session_duration_avg INTEGER DEFAULT 0, -- em segundos
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

-- Criar tabela de funil de conversão
CREATE TABLE IF NOT EXISTS conversion_funnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  
  -- Etapas do funil
  visitors INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  profile_completed INTEGER DEFAULT 0,
  first_gig_created INTEGER DEFAULT 0,
  first_proposal_sent INTEGER DEFAULT 0,
  first_payment INTEGER DEFAULT 0,
  
  -- Taxas de conversão (calculadas)
  signup_rate NUMERIC(5,2) DEFAULT 0,
  profile_completion_rate NUMERIC(5,2) DEFAULT 0,
  gig_creation_rate NUMERIC(5,2) DEFAULT 0,
  proposal_rate NUMERIC(5,2) DEFAULT 0,
  payment_rate NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

-- Criar tabela de cohorts de usuários
CREATE TABLE IF NOT EXISTS user_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_month DATE NOT NULL, -- primeiro dia do mês
  period_number INTEGER NOT NULL, -- 0, 1, 2, 3... (meses desde registro)
  
  users_count INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Métricas de valor
  revenue_per_user NUMERIC(10,2) DEFAULT 0,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cohort_month, period_number)
);

-- Criar tabela de insights automáticos
CREATE TABLE IF NOT EXISTS business_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL, -- growth, anomaly, opportunity, warning
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Dados do insight
  metric_name TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  change_percentage NUMERIC(5,2),
  
  -- Metadados
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  
  -- Período analisado
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (apenas admins podem ver analytics)
CREATE POLICY "Apenas admins podem ver eventos" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Sistema pode inserir eventos" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Apenas admins podem ver métricas" ON daily_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Apenas admins podem ver funil" ON conversion_funnel
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Apenas admins podem ver cohorts" ON user_cohorts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Apenas admins podem ver insights" ON business_insights
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Função para calcular métricas diárias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  metrics_record RECORD;
BEGIN
  -- Calcular métricas do dia
  SELECT 
    -- Usuários
    COUNT(CASE WHEN DATE(p.created_at) = target_date THEN 1 END) as new_users,
    COUNT(CASE WHEN DATE(p.created_at) <= target_date THEN 1 END) as active_users,
    
    -- Gigs
    COUNT(CASE WHEN DATE(g.created_at) = target_date THEN 1 END) as gigs_created,
    COUNT(CASE WHEN DATE(g.updated_at) = target_date AND g.status = 'approved' THEN 1 END) as gigs_approved,
    COUNT(CASE WHEN DATE(g.updated_at) = target_date AND g.status = 'completed' THEN 1 END) as gigs_completed,
    
    -- Propostas
    COUNT(CASE WHEN DATE(gr.created_at) = target_date THEN 1 END) as proposals_sent,
    COUNT(CASE WHEN DATE(gr.updated_at) = target_date AND gr.status = 'accepted' THEN 1 END) as proposals_accepted,
    
    -- Pagamentos
    COALESCE(SUM(CASE WHEN DATE(pay.created_at) = target_date THEN pay.amount END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN DATE(pay.created_at) = target_date THEN pay.platform_fee END), 0) as platform_revenue,
    COUNT(CASE WHEN DATE(pay.created_at) = target_date THEN 1 END) as transactions_count,
    
    -- Reviews
    COUNT(CASE WHEN DATE(r.created_at) = target_date THEN 1 END) as reviews_created,
    COALESCE(AVG(CASE WHEN DATE(r.created_at) = target_date THEN r.rating END), 0) as average_rating
    
  INTO metrics_record
  FROM profiles p
  FULL OUTER JOIN gigs g ON true
  FULL OUTER JOIN gig_responses gr ON true
  FULL OUTER JOIN payments pay ON true
  FULL OUTER JOIN reviews r ON true;
  
  -- Inserir ou atualizar métricas
  INSERT INTO daily_metrics (
    date, new_users, active_users, gigs_created, gigs_approved, gigs_completed,
    proposals_sent, proposals_accepted, total_revenue, platform_revenue,
    transactions_count, reviews_created, average_rating, updated_at
  ) VALUES (
    target_date, metrics_record.new_users, metrics_record.active_users,
    metrics_record.gigs_created, metrics_record.gigs_approved, metrics_record.gigs_completed,
    metrics_record.proposals_sent, metrics_record.proposals_accepted,
    metrics_record.total_revenue, metrics_record.platform_revenue,
    metrics_record.transactions_count, metrics_record.reviews_created,
    metrics_record.average_rating, NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    gigs_created = EXCLUDED.gigs_created,
    gigs_approved = EXCLUDED.gigs_approved,
    gigs_completed = EXCLUDED.gigs_completed,
    proposals_sent = EXCLUDED.proposals_sent,
    proposals_accepted = EXCLUDED.proposals_accepted,
    total_revenue = EXCLUDED.total_revenue,
    platform_revenue = EXCLUDED.platform_revenue,
    transactions_count = EXCLUDED.transactions_count,
    reviews_created = EXCLUDED.reviews_created,
    average_rating = EXCLUDED.average_rating,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para gerar insights automáticos
CREATE OR REPLACE FUNCTION generate_business_insights()
RETURNS VOID AS $$
DECLARE
  current_metrics RECORD;
  previous_metrics RECORD;
  growth_rate NUMERIC;
BEGIN
  -- Buscar métricas atuais e anteriores
  SELECT * INTO current_metrics FROM daily_metrics WHERE date = CURRENT_DATE - INTERVAL '1 day';
  SELECT * INTO previous_metrics FROM daily_metrics WHERE date = CURRENT_DATE - INTERVAL '8 days';
  
  IF current_metrics IS NOT NULL AND previous_metrics IS NOT NULL THEN
    -- Insight de crescimento de usuários
    IF previous_metrics.new_users > 0 THEN
      growth_rate := ((current_metrics.new_users - previous_metrics.new_users)::NUMERIC / previous_metrics.new_users) * 100;
      
      IF growth_rate > 20 THEN
        INSERT INTO business_insights (insight_type, title, description, metric_name, current_value, previous_value, change_percentage, severity)
        VALUES ('growth', 'Crescimento Acelerado de Usuários', 
                FORMAT('Novos usuários cresceram %s%% na última semana', ROUND(growth_rate, 1)),
                'new_users', current_metrics.new_users, previous_metrics.new_users, growth_rate, 'info');
      ELSIF growth_rate < -20 THEN
        INSERT INTO business_insights (insight_type, title, description, metric_name, current_value, previous_value, change_percentage, severity)
        VALUES ('warning', 'Queda no Crescimento de Usuários', 
                FORMAT('Novos usuários caíram %s%% na última semana', ABS(ROUND(growth_rate, 1))),
                'new_users', current_metrics.new_users, previous_metrics.new_users, growth_rate, 'warning');
      END IF;
    END IF;
    
    -- Insight de receita
    IF previous_metrics.total_revenue > 0 THEN
      growth_rate := ((current_metrics.total_revenue - previous_metrics.total_revenue) / previous_metrics.total_revenue) * 100;
      
      IF growth_rate > 30 THEN
        INSERT INTO business_insights (insight_type, title, description, metric_name, current_value, previous_value, change_percentage, severity)
        VALUES ('growth', 'Receita em Alta', 
                FORMAT('Receita cresceu %s%% comparado à semana anterior', ROUND(growth_rate, 1)),
                'total_revenue', current_metrics.total_revenue, previous_metrics.total_revenue, growth_rate, 'info');
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_date ON conversion_funnel(date);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_cohort_month ON user_cohorts(cohort_month);
CREATE INDEX IF NOT EXISTS idx_business_insights_created_at ON business_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_business_insights_is_read ON business_insights(is_read);

-- Inserir dados iniciais para demonstração
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '7 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '6 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '5 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '4 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '3 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '2 days');
SELECT calculate_daily_metrics(CURRENT_DATE - INTERVAL '1 day');
SELECT calculate_daily_metrics(CURRENT_DATE);

-- Gerar insights iniciais
SELECT generate_business_insights();
