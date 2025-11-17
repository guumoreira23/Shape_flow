-- Migration: Adicionar campo theme na tabela users
-- Este script adiciona a coluna theme com valor padrão 'dark'

ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Atualizar registros existentes para ter 'dark' como padrão se NULL
UPDATE users
SET theme = 'dark'
WHERE theme IS NULL;

