-- MIGRAÇÃO SIMPLES - SISTEMA OS
\echo 'Iniciando migração das 3 entidades...'

BEGIN;

-- 1. CRIAR TABELA EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INSERIR EMPRESA PADRÃO
INSERT INTO empresas (nome, cnpj, email, telefone, endereco) 
VALUES (
  'Oficina Programa Macedo', 
  '12.345.678/0001-90', 
  'contato@programamacedo.com', 
  '(11) 99999-9999', 
  'São Paulo, SP'
) ON CONFLICT (cnpj) DO NOTHING;

-- 3. ADICIONAR COLUNAS USUARIOS
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id INTEGER DEFAULT 1;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario VARCHAR(20) DEFAULT 'operador';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf_usuario VARCHAR(14) UNIQUE;

-- Conversão segura de tipos
UPDATE usuarios SET tipo_usuario = 'admin' WHERE tipo = 'admin';
UPDATE usuarios SET tipo_usuario = 'operador' WHERE tipo != 'admin' OR tipo IS NULL;

-- 4. ADICIONAR COLUNAS CLIENTES  
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa_id INTEGER DEFAULT 1;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Limpar CPFs
UPDATE clientes SET cpf = REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') 
WHERE cpf IS NOT NULL AND cpf != '';

-- Marcar inativos
UPDATE clientes SET ativo = NOT COALESCE(ficha_inativa, FALSE);

-- 5. ADICIONAR COLUNAS ORCAMENTOS
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS cliente_cpf VARCHAR(14);
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS empresa_id INTEGER DEFAULT 1;

-- Vincular CPFs nos orçamentos
UPDATE orcamentos SET cliente_cpf = (
    SELECT REGEXP_REPLACE(c.cpf, '[^0-9]', '', 'g')
    FROM clientes c 
    WHERE c.id = orcamentos.cliente_id
      AND c.cpf IS NOT NULL AND c.cpf != ''
    LIMIT 1
) WHERE cliente_id IS NOT NULL AND cliente_cpf IS NULL;

-- 6. ADICIONAR COLUNAS ORDEM_SERVICOS
ALTER TABLE ordem_servicos ADD COLUMN IF NOT EXISTS cliente_cpf VARCHAR(14);
ALTER TABLE ordem_servicos ADD COLUMN IF NOT EXISTS empresa_id INTEGER DEFAULT 1;

-- Vincular CPFs nas OS
UPDATE ordem_servicos SET cliente_cpf = (
    SELECT REGEXP_REPLACE(c.cpf, '[^0-9]', '', 'g')
    FROM clientes c 
    WHERE c.id = ordem_servicos.cliente_id
      AND c.cpf IS NOT NULL AND c.cpf != ''
    LIMIT 1
) WHERE cliente_id IS NOT NULL AND cliente_cpf IS NULL;

-- 7. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);

-- 8. OTIMIZAR
ANALYZE empresas;
ANALYZE usuarios;
ANALYZE clientes;
ANALYZE orcamentos;
ANALYZE ordem_servicos;

COMMIT;

-- VERIFICAÇÃO
\echo 'Migração concluída! Verificando resultados...'

SELECT 
  'EMPRESAS' as tabela, 
  COUNT(*) as registros 
FROM empresas
UNION ALL
SELECT 'USUARIOS', COUNT(*) FROM usuarios
UNION ALL  
SELECT 'CLIENTES', COUNT(*) FROM clientes
UNION ALL
SELECT 'ORCAMENTOS', COUNT(*) FROM orcamentos
UNION ALL
SELECT 'ORDEM_SERVICOS', COUNT(*) FROM ordem_servicos;

\echo 'Sistema pronto para as 3 entidades!'