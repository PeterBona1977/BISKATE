
-- Rename column 'read' to 'is_read' if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications RENAME COLUMN "read" TO "is_read";
        RAISE NOTICE '✅ Column "read" renamed to "is_read" in notifications table.';
    ELSE
        RAISE NOTICE 'ℹ️ Column "read" does not exist or already renamed.';
    END IF;
END $$;
