-- EXECUTAR NO SUPABASE SQL EDITOR --

-- 1. Tabela de Métodos de Pagamento
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('card', 'paypal', 'bank_transfer')),
    provider TEXT NOT NULL, -- e.g., 'stripe', 'paypal'
    last4 TEXT,
    brand TEXT, -- visa, mastercard, etc.
    expiry_date TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Subscrições de Utilizador
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL, -- referindo-se ao plan_tier em plan_limits
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trailing')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ativar RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para payment_methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- 5. Políticas RLS para user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
