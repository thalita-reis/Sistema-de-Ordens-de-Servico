\echo '🚀 INICIANDO MIGRAÇÃO CORRIGIDA...'

BEGIN;

-- PASSO 1: CRIAR TABELA EMPRESAS
\echo '🏢 PASSO 1: Criando tabela empresas...'

CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  logo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

\echo '✅ Tabela empresas criada!'

-- PASSO 2: MIGRAR DADOS DA EMPRESA
\echo '🏪 PASSO 2: Migrando dados de dados_empresas...'

INSERT INTO empresas (nome, cnpj, email, telefone, endereco, created_at, updated_at)
SELECT 
  COALESCE(nome_oficina, razao_social, 'Oficina Sistema OS') as nome,
  COALESCE(cnpj, '00.000.000/0001-00') as cnpj,
  email,
  celular as telefone,
  CASE 
    WHEN endereco IS NOT NULL THEN 
      CONCAT(endereco, 
             CASE WHEN numero IS NOT NULL THEN ', ' || numero ELSE '' END,
             CASE WHEN bairro IS NOT NULL THEN ' - ' || bairro ELSE '' END,
             CASE WHEN cidade IS NOT NULL THEN ', ' || cidade ELSE '' END,
             CASE WHEN estado IS NOT NULL THEN '/' || estado ELSE '' END,
             CASE WHEN cep IS NOT NULL THEN ' - CEP: ' || cep ELSE '' END)
    ELSE 'Endereço não informado'
  END as endereco,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM dados_empresas
ORDER BY id
LIMIT 1
ON CONFLICT (cnpj) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  telefone = EXCLUDED.telefone,
  endereco = EXCLUDED.endereco;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM empresas) THEN
    INSERT INTO empresas (nome, cnpj, email, telefone, endereco) 
    VALUES (
      'Oficina Programa Macedo', 
      '12.345.678/0001-90', 
      'contato@programamacedo.com', 
      '(11) 99999-9999', 
      'São Paulo, SP'
    );
    RAISE NOTICE '🏪 Empresa padrão criada';
  END IF;
END $$;

\echo '✅ Dados da empresa configurados!'

-- PASSO 3: ATUALIZAR TABELA USUARIOS (CORRIGIDO)
\echo '👤 PASSO 3: Atualizando tabela usuarios (versão corrigida)...'

DO $$ 
BEGIN
    -- Primeiro vamos ver quais valores existem no campo tipo
    RAISE NOTICE 'Verificando valores atuais do campo tipo...';
    
    -- Adicionar empresa_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='empresa_id') THEN
        ALTER TABLE usuarios ADD COLUMN empresa_id INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Coluna empresa_id adicionada aos usuarios';
    END IF;
    
    -- Adicionar tipo_usuario (sem conversão automática)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='tipo_usuario') THEN
        ALTER TABLE usuarios ADD COLUMN tipo_usuario VARCHAR(20) DEFAULT 'operador';
        
        -- Conversão manual mais segura
        UPDATE usuarios SET tipo_usuario = 'admin' WHERE tipo = 'admin';
        UPDATE usuarios SET tipo_usuario = 'operador' WHERE tipo != 'admin' OR tipo IS NULL;
        
        ALTER TABLE usuarios ADD CONSTRAINT check_tipo_usuario 
            CHECK (tipo_usuario IN ('admin', 'operador'));
        RAISE NOTICE '✅ Coluna tipo_usuario adicionada e convertida';
    END IF;
    
    -- Adicionar CPF para usuarios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='cpf_usuario') THEN
        ALTER TABLE usuarios ADD COLUMN cpf_usuario VARCHAR(14) UNIQUE;
        RAISE NOTICE '✅ Coluna cpf_usuario adicionada';
    END IF;
END $$;

-- Foreign key usuarios -> empresas
DO $$
BEGIN
    BEGIN
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_empresa_id_fkey 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id);
        RAISE NOTICE '🔗 Foreign key usuarios -> empresas criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key usuarios -> empresas já existe';
    END;
END $$;

-- Garantir que existe pelo menos um admin
UPDATE usuarios SET tipo_usuario = 'admin' 
WHERE id = (SELECT MIN(id) FROM usuarios);

\echo '✅ Tabela usuarios atualizada!'

-- PASSO 4: OTIMIZAR TABELA CLIENTES
\echo '👥 PASSO 4: Otimizando tabela clientes...'

DO $$
BEGIN
    -- Adicionar empresa_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clientes' AND column_name='empresa_id') THEN
        ALTER TABLE clientes ADD COLUMN empresa_id INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Coluna empresa_id adicionada aos clientes';
    END IF;
    
    -- Adicionar ativo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clientes' AND column_name='ativo') THEN
        ALTER TABLE clientes ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Coluna ativo adicionada aos clientes';
    END IF;
    
    -- Foreign key clientes -> empresas
    BEGIN
        ALTER TABLE clientes 
        ADD CONSTRAINT clientes_empresa_id_fkey 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id);
        RAISE NOTICE '🔗 Foreign key clientes -> empresas criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key clientes -> empresas já existe';
    END;
    
    -- Limpar CPFs (remover formatação)
    UPDATE clientes SET cpf = REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') 
    WHERE cpf IS NOT NULL AND cpf != '';
    
    -- Marcar clientes inativos baseado na ficha_inativa
    UPDATE clientes SET ativo = NOT COALESCE(ficha_inativa, FALSE);
    
    RAISE NOTICE '✅ CPFs limpos e clientes otimizados!';
END $$;

\echo '✅ Tabela clientes otimizada!'

-- PASSO 5: CONECTAR ORCAMENTOS
\echo '📊 PASSO 5: Conectando orçamentos...'

DO $$
BEGIN
    -- Adicionar cliente_cpf
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orcamentos' AND column_name='cliente_cpf') THEN
        ALTER TABLE orcamentos ADD COLUMN cliente_cpf VARCHAR(14);
        RAISE NOTICE '✅ Coluna cliente_cpf adicionada aos orçamentos';
        
        -- Vincular CPF baseado no cliente_id existente
        UPDATE orcamentos SET cliente_cpf = (
            SELECT REGEXP_REPLACE(c.cpf, '[^0-9]', '', 'g')
            FROM clientes c 
            WHERE c.id = orcamentos.cliente_id
              AND c.cpf IS NOT NULL 
              AND c.cpf != ''
            LIMIT 1
        ) WHERE cliente_id IS NOT NULL;
        
        RAISE NOTICE '🔗 CPFs vinculados aos orçamentos existentes';
    END IF;
    
    -- Adicionar empresa_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orcamentos' AND column_name='empresa_id') THEN
        ALTER TABLE orcamentos ADD COLUMN empresa_id INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Coluna empresa_id adicionada aos orçamentos';
    END IF;
    
    -- Foreign keys (com tratamento de erros)
    BEGIN
        ALTER TABLE orcamentos 
        ADD CONSTRAINT orcamentos_cliente_cpf_fkey 
        FOREIGN KEY (cliente_cpf) REFERENCES clientes(cpf) ON DELETE SET NULL;
        RAISE NOTICE '🔗 Foreign key orcamentos -> clientes criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key orcamentos -> clientes já existe';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Não foi possível criar FK orcamentos -> clientes: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE orcamentos 
        ADD CONSTRAINT orcamentos_empresa_id_fkey 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id);
        RAISE NOTICE '🔗 Foreign key orcamentos -> empresas criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key orcamentos -> empresas já existe';
    END;
END $$;

\echo '✅ Orçamentos conectados!'

-- PASSO 6: CONECTAR ORDEM DE SERVIÇOS
\echo '🔧 PASSO 6: Conectando ordens de serviço...'

DO $$
BEGIN
    -- Adicionar cliente_cpf
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ordem_servicos' AND column_name='cliente_cpf') THEN
        ALTER TABLE ordem_servicos ADD COLUMN cliente_cpf VARCHAR(14);
        RAISE NOTICE '✅ Coluna cliente_cpf adicionada às OS';
        
        -- Vincular CPF baseado no cliente_id existente
        UPDATE ordem_servicos SET cliente_cpf = (
            SELECT REGEXP_REPLACE(c.cpf, '[^0-9]', '', 'g')
            FROM clientes c 
            WHERE c.id = ordem_servicos.cliente_id
              AND c.cpf IS NOT NULL 
              AND c.cpf != ''
            LIMIT 1
        ) WHERE cliente_id IS NOT NULL;
        
        RAISE NOTICE '🔗 CPFs vinculados às ordens de serviço existentes';
    END IF;
    
    -- Adicionar empresa_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ordem_servicos' AND column_name='empresa_id') THEN
        ALTER TABLE ordem_servicos ADD COLUMN empresa_id INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Coluna empresa_id adicionada às OS';
    END IF;
    
    -- Foreign keys (com tratamento de erros)
    BEGIN
        ALTER TABLE ordem_servicos 
        ADD CONSTRAINT ordem_servicos_cliente_cpf_fkey 
        FOREIGN KEY (cliente_cpf) REFERENCES clientes(cpf) ON DELETE SET NULL;
        RAISE NOTICE '🔗 Foreign key OS -> clientes criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key OS -> clientes já existe';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Não foi possível criar FK OS -> clientes: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE ordem_servicos 
        ADD CONSTRAINT ordem_servicos_empresa_id_fkey 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id);
        RAISE NOTICE '🔗 Foreign key OS -> empresas criada';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE '🔗 Foreign key OS -> empresas já existe';
    END;
END $$;

\echo '✅ Ordens de serviço conectadas!'

-- PASSO 7: CRIAR ÍNDICES
\echo '⚡ PASSO 7: Criando índices...'

CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_cpf ON orcamentos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_os_cliente_cpf ON ordem_servicos(cliente_cpf);

\echo '✅ Índices criados!'

-- PASSO 8: OTIMIZAÇÃO
\echo '🔧 PASSO 8: Otimizando...'

ANALYZE empresas;
ANALYZE usuarios;
ANALYZE clientes;
ANALYZE orcamentos;
ANALYZE ordem_servicos;

\echo '✅ Otimização concluída!'

COMMIT;

-- VERIFICAÇÃO FINAL
\echo ''
\echo '🎉 MIGRAÇÃO CORRIGIDA CONCLUÍDA!'
\echo ''

SELECT 
  '🏢 EMPRESAS' as entidade, 
  COUNT(*)::text || ' registros' as quantidade
FROM empresas
UNION ALL
SELECT '👤 USUARIOS', COUNT(*)::text || ' registros' FROM usuarios
UNION ALL  
SELECT '👥 CLIENTES', COUNT(*)::text || ' registros' FROM clientes
UNION ALL
SELECT '📊 ORCAMENTOS', COUNT(*)::text || ' registros' FROM orcamentos
UNION ALL
SELECT '🔧 ORDEM SERVIÇOS', COUNT(*)::text || ' registros' FROM ordem_servicos;

\echo ''
\echo '✅ SISTEMA PRONTO PARA AS 3 ENTIDADES!'