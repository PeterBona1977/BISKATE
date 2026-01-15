-- Adicionar colunas de duração à tabela gigs se não existirem
DO $$ 
BEGIN
    -- Verificar se a coluna estimated_duration existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gigs' AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE gigs ADD COLUMN estimated_duration INTEGER;
    END IF;

    -- Verificar se a coluna duration_unit existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gigs' AND column_name = 'duration_unit'
    ) THEN
        ALTER TABLE gigs ADD COLUMN duration_unit TEXT DEFAULT 'hours' CHECK (duration_unit IN ('hours', 'days', 'weeks'));
    END IF;
END $$;

-- Atualizar gigs existentes com valores padrão se necessário
UPDATE gigs 
SET 
    estimated_duration = 2,
    duration_unit = 'hours'
WHERE estimated_duration IS NULL;

-- Adicionar constraint para duration_unit
-- Constraint já adicionada na criação da coluna duration_unit

-- Comentários para documentação
COMMENT ON COLUMN gigs.estimated_duration IS 'Estimated duration as a number (e.g., 2 for 2 hours/days/weeks)';
COMMENT ON COLUMN gigs.duration_unit IS 'Unit of duration: hours, days, or weeks';

-- Criar índice para melhorar o desempenho em consultas de duração
CREATE INDEX IF NOT EXISTS idx_gigs_duration ON gigs(estimated_duration, duration_unit);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gigs' 
AND column_name IN ('estimated_duration', 'duration_unit')
ORDER BY column_name;
