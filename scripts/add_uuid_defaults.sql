-- Script para adicionar DEFAULT uuid_generate_v4() a todos os campos id
-- Primeiro, habilitar a extensão uuid-ossp se ainda não estiver ativada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para verificar se uma tabela já tem DEFAULT para sua coluna id
CREATE OR REPLACE FUNCTION has_id_default(p_table_name text) RETURNS boolean AS $$
DECLARE
  has_default boolean;
BEGIN
  SELECT COUNT(*) > 0 INTO has_default
  FROM information_schema.columns
  WHERE information_schema.columns.table_name = p_table_name
    AND column_name = 'id'
    AND column_default IS NOT NULL;
  RETURN has_default;
END;
$$ LANGUAGE plpgsql;

-- Adicionar DEFAULT para cada tabela
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  LOOP
    IF NOT has_id_default(tbl) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT uuid_generate_v4();', tbl);
      RAISE NOTICE 'Adicionado DEFAULT para id na tabela %', tbl;
    ELSE
      RAISE NOTICE 'Tabela % já tem DEFAULT para id, pulando...', tbl;
    END IF;
  END LOOP;
END;
$$;

-- Limpeza: remover a função auxiliar após o uso
DROP FUNCTION IF EXISTS has_id_default;
