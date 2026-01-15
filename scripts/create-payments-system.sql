-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES gig_responses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  stripe_refund_id TEXT,
  
  -- Valores
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  provider_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status do pagamento
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 
    'cancelled', 'refunded', 'disputed', 'escrowed', 'released'
  )),
  
  -- Escrow
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  escrow_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  payment_method TEXT,
  failure_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  
  -- Dados do cliente
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address JSONB,
  client_tax_id TEXT,
  
  -- Dados do prestador
  provider_name TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_address JSONB,
  provider_tax_id TEXT,
  
  -- Detalhes da fatura
  description TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  
  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  type TEXT NOT NULL CHECK (type IN (
    'payment', 'refund', 'fee', 'payout', 'escrow_release', 'chargeback'
  )),
  
  -- Valores
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'cancelled'
  )),
  
  -- Metadados
  description TEXT,
  reference_id TEXT,
  stripe_transaction_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configurações de pagamento
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  
  -- Configurações
  auto_payout BOOLEAN DEFAULT TRUE,
  payout_schedule TEXT DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'monthly')),
  
  -- Dados bancários
  bank_account JSONB,
  tax_info JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pagamentos
CREATE POLICY "Usuários podem ver seus pagamentos" ON payments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR 
      provider_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Clientes podem criar pagamentos" ON payments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND client_id = auth.uid()
  );

CREATE POLICY "Sistema pode atualizar pagamentos" ON payments
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      client_id = auth.uid() OR 
      provider_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas RLS para faturas
CREATE POLICY "Participantes podem ver faturas" ON invoices
  FOR SELECT USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM payments 
      WHERE payments.id = payment_id 
      AND (payments.client_id = auth.uid() OR payments.provider_id = auth.uid())
    )
  );

-- Políticas RLS para transações
CREATE POLICY "Usuários podem ver suas transações" ON transactions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Políticas RLS para configurações de pagamento
CREATE POLICY "Usuários podem gerenciar suas configurações" ON payment_settings
  FOR ALL USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || year_suffix || '-(.*)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_suffix || '-%';
  
  RETURN 'INV-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de fatura automaticamente
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Função para calcular taxa da plataforma
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount NUMERIC, category TEXT DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
  fee_percentage NUMERIC := 0.05; -- 5% padrão
  category_fee NUMERIC;
BEGIN
  -- Buscar taxa específica da categoria se fornecida
  IF category IS NOT NULL THEN
    SELECT margin_percentage / 100 INTO category_fee
    FROM categories 
    WHERE name = category OR slug = category;
    
    IF category_fee IS NOT NULL THEN
      fee_percentage := category_fee;
    END IF;
  END IF;
  
  RETURN ROUND(amount * fee_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
