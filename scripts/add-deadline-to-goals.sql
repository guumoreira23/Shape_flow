-- Migration: Adicionar campo deadline na tabela goals
-- Execute este script no seu banco de dados PostgreSQL

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- Comentário: Campo opcional para armazenar data limite da meta

