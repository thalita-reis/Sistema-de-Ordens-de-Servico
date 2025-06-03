const express = require('express');
const router = express.Router();

// ============================================
// 🗄️ IMPORTAÇÃO DO BANCO DE DADOS
// ============================================
const { pool } = require('../config/database');

// ============================================
// 🧪 ROTA DE TESTE PARA DIAGNÓSTICO
// ============================================
router.get('/test', async (req, res) => {
  try {
    console.log('\n🧪 ===== TESTE DE DIAGNÓSTICO =====');
    
    // 1. Verificar pool
    console.log('🔍 Pool disponível:', !!pool);
    
    // 2. Testar conexão básica
    const basicTest = await pool.query('SELECT current_database() as db, current_user as user');
    console.log('✅ Conectado no banco:', basicTest.rows[0].db);
    console.log('✅ Usuário:', basicTest.rows[0].user);
    
    // 3. Verificar tabela dados_empresas
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dados_empresas'
      )
    `);
    console.log('✅ Tabela dados_empresas existe:', tableExists.rows[0].exists);
    
    // 4. Contar registros
    const count = await pool.query('SELECT COUNT(*) as total FROM dados_empresas');
    console.log('✅ Total de registros:', count.rows[0].total);
    
    // 5. Verificar ID 3 específico
    const id3Check = await pool.query('SELECT id, razao_social FROM dados_empresas WHERE id = 3');
    console.log('✅ ID 3 existe:', id3Check.rows.length > 0);
    if (id3Check.rows.length > 0) {
      console.log('✅ ID 3 dados:', id3Check.rows[0]);
    }
    
    // 6. Buscar registro mais recente
    const latest = await pool.query('SELECT id, razao_social, updated_at FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
    console.log('✅ Registro mais recente:', latest.rows[0]);
    
    console.log('===== FIM TESTE =====\n');
    
    res.json({
      status: 'SUCCESS',
      database: basicTest.rows[0].db,
      user: basicTest.rows[0].user,
      table_exists: tableExists.rows[0].exists,
      total_records: parseInt(count.rows[0].total),
      id_3_exists: id3Check.rows.length > 0,
      id_3_data: id3Check.rows[0] || null,
      latest_record: latest.rows[0] || null
    });
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      code: error.code
    });
  }
});

// ============================================
// 📖 GET - BUSCAR DADOS DA EMPRESA (para administração e orçamentos)
// ============================================
router.get('/', async (req, res) => {
  console.log('\n🔍 ===== BUSCAR EMPRESA =====');
  
  try {
    // Verificar pool
    if (!pool) {
      console.error('❌ Pool não disponível');
      return res.status(500).json({
        sucesso: false,
        erro: 'Conexão com banco não disponível'
      });
    }
    
    console.log('✅ Pool OK, buscando empresa...');
    
    // ESTRATÉGIA 1: Buscar ID 3 específico (seus dados corretos)
    console.log('🎯 Estratégia 1: Buscando ID 3...');
    const id3Result = await pool.query('SELECT * FROM dados_empresas WHERE id = 3');
    
    if (id3Result.rows.length > 0) {
      console.log('✅ SUCESSO! ID 3 encontrado');
      console.log('📄 Empresa:', id3Result.rows[0].razao_social);
      
      const dados = id3Result.rows[0];
      
      // Formatação para compatibilidade com frontend e orçamentos
      const dadosFormatados = {
        id: dados.id,
        razao_social: dados.razao_social,
        nome_oficina: dados.nome_oficina,
        cnpj: dados.cnpj,
        inscricao_estadual: dados.inscricao_estadual,
        email: dados.email,
        cep: dados.cep,
        endereco: dados.endereco,
        numero: dados.numero,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        telefone: dados.celular, // Para compatibilidade com orçamentos
        celular: dados.celular,
        created_at: dados.created_at,
        updated_at: dados.updated_at,
        fonte: 'dados_empresas_id_3'
      };
      
      console.log('===== FIM BUSCA (ID 3) =====\n');
      return res.json(dadosFormatados);
    }
    
    console.log('⚠️ ID 3 não encontrado');
    
    // ESTRATÉGIA 2: Buscar o mais recente
    console.log('🎯 Estratégia 2: Buscando mais recente...');
    const latestResult = await pool.query(`
      SELECT * FROM dados_empresas 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (latestResult.rows.length > 0) {
      console.log('✅ SUCESSO! Registro mais recente encontrado');
      console.log('📄 Empresa:', latestResult.rows[0].razao_social);
      
      const dados = latestResult.rows[0];
      
      const dadosFormatados = {
        id: dados.id,
        razao_social: dados.razao_social,
        nome_oficina: dados.nome_oficina,
        cnpj: dados.cnpj,
        inscricao_estadual: dados.inscricao_estadual,
        email: dados.email,
        cep: dados.cep,
        endereco: dados.endereco,
        numero: dados.numero,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        telefone: dados.celular,
        celular: dados.celular,
        created_at: dados.created_at,
        updated_at: dados.updated_at,
        fonte: 'dados_empresas_latest'
      };
      
      console.log('===== FIM BUSCA (MAIS RECENTE) =====\n');
      return res.json(dadosFormatados);
    }
    
    console.log('⚠️ Mais recente não encontrado');
    
    // ESTRATÉGIA 3: Qualquer registro
    console.log('🎯 Estratégia 3: Buscando qualquer registro...');
    const anyResult = await pool.query('SELECT * FROM dados_empresas LIMIT 1');
    
    if (anyResult.rows.length > 0) {
      console.log('✅ SUCESSO! Algum registro encontrado');
      console.log('📄 Empresa:', anyResult.rows[0].razao_social);
      
      const dados = anyResult.rows[0];
      
      const dadosFormatados = {
        id: dados.id,
        razao_social: dados.razao_social,
        nome_oficina: dados.nome_oficina,
        cnpj: dados.cnpj,
        inscricao_estadual: dados.inscricao_estadual,
        email: dados.email,
        cep: dados.cep,
        endereco: dados.endereco,
        numero: dados.numero,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        telefone: dados.celular,
        celular: dados.celular,
        created_at: dados.created_at,
        updated_at: dados.updated_at,
        fonte: 'dados_empresas_any'
      };
      
      console.log('===== FIM BUSCA (QUALQUER) =====\n');
      return res.json(dadosFormatados);
    }
    
    // Nenhum registro encontrado
    console.log('❌ NENHUM REGISTRO ENCONTRADO');
    console.log('===== FIM BUSCA (VAZIO) =====\n');
    
    res.status(404).json({
      sucesso: false,
      erro: 'Nenhuma empresa cadastrada',
      mensagem: 'Tabela dados_empresas está vazia'
    });
    
  } catch (error) {
    console.error('\n❌ ===== ERRO BUSCA EMPRESA =====');
    console.error('💥 Erro:', error.message);
    console.error('🔢 Código:', error.code);
    console.error('📚 Stack:', error.stack);
    console.error('===== FIM ERRO =====\n');
    
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor',
      mensagem: error.message,
      codigo: error.code
    });
  }
});

// ============================================
// 💾 PUT - ATUALIZAR EMPRESA (usado pela administração)
// ============================================
router.put('/', async (req, res) => {
  console.log('\n💾 ===== ATUALIZAR EMPRESA =====');
  
  try {
    if (!pool) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Pool não disponível'
      });
    }
    
    const dados = req.body;
    console.log('📝 Dados recebidos para atualização:', {
      razao_social: dados.razao_social,
      nome_oficina: dados.nome_oficina,
      cnpj: dados.cnpj,
      email: dados.email
    });
    
    // Validação básica
    if (!dados.razao_social && !dados.nome_oficina) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome da empresa é obrigatório'
      });
    }
    
    // Tentar atualizar ID 3 primeiro (seus dados principais)
    const updateQuery = `
      UPDATE dados_empresas SET
        razao_social = $1,
        nome_oficina = $2,
        cnpj = $3,
        inscricao_estadual = $4,
        email = $5,
        endereco = $6,
        numero = $7,
        bairro = $8,
        celular = $9,
        cidade = $10,
        estado = $11,
        cep = $12,
        updated_at = NOW()
      WHERE id = 3
      RETURNING *
    `;
    
    const valores = [
      dados.razao_social || dados.nome_oficina || '',
      dados.nome_oficina || dados.razao_social || '',
      dados.cnpj || '',
      dados.inscricao_estadual || '',
      dados.email || '',
      dados.endereco || '',
      dados.numero || '',
      dados.bairro || '',
      dados.celular || '',
      dados.cidade || '',
      dados.estado || '',
      dados.cep || ''
    ];
    
    console.log('🔄 Executando update no ID 3...');
    const result = await pool.query(updateQuery, valores);
    
    if (result.rows.length > 0) {
      console.log('✅ Empresa ID 3 atualizada com sucesso');
      console.log('📄 Dados atualizados:', result.rows[0]);
      console.log('===== FIM ATUALIZAÇÃO =====\n');
      
      const dadosAtualizados = result.rows[0];
      
      // Formatação para resposta
      const resposta = {
        sucesso: true,
        empresa: {
          id: dadosAtualizados.id,
          razao_social: dadosAtualizados.razao_social,
          nome_oficina: dadosAtualizados.nome_oficina,
          cnpj: dadosAtualizados.cnpj,
          inscricao_estadual: dadosAtualizados.inscricao_estadual,
          email: dadosAtualizados.email,
          endereco: dadosAtualizados.endereco,
          numero: dadosAtualizados.numero,
          bairro: dadosAtualizados.bairro,
          cidade: dadosAtualizados.cidade,
          estado: dadosAtualizados.estado,
          celular: dadosAtualizados.celular,
          cep: dadosAtualizados.cep,
          telefone: dadosAtualizados.celular, // Para compatibilidade
          updated_at: dadosAtualizados.updated_at
        },
        mensagem: 'Dados atualizados com sucesso'
      };
      
      res.json(resposta);
    } else {
      console.log('❌ ID 3 não encontrado - tentando atualizar o mais recente...');
      
      // Se ID 3 não existir, atualizar o registro mais recente
      const updateLatestQuery = `
        UPDATE dados_empresas SET
          razao_social = $1,
          nome_oficina = $2,
          cnpj = $3,
          inscricao_estadual = $4,
          email = $5,
          endereco = $6,
          numero = $7,
          bairro = $8,
          celular = $9,
          cidade = $10,
          estado = $11,
          cep = $12,
          updated_at = NOW()
        WHERE id = (SELECT id FROM dados_empresas ORDER BY updated_at DESC LIMIT 1)
        RETURNING *
      `;
      
      const resultLatest = await pool.query(updateLatestQuery, valores);
      
      if (resultLatest.rows.length > 0) {
        console.log('✅ Registro mais recente atualizado');
        console.log('===== FIM ATUALIZAÇÃO =====\n');
        
        res.json({
          sucesso: true,
          empresa: resultLatest.rows[0],
          mensagem: 'Dados atualizados com sucesso'
        });
      } else {
        console.log('❌ Nenhum registro encontrado para atualização');
        console.log('===== FIM ATUALIZAÇÃO =====\n');
        
        res.status(404).json({
          sucesso: false,
          erro: 'Empresa não encontrada para atualização'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar:', error.message);
    console.error('===== FIM ERRO ATUALIZAÇÃO =====\n');
    
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// ============================================
// 📄 POST - CRIAR NOVA EMPRESA (se necessário)
// ============================================
router.post('/', async (req, res) => {
  console.log('\n➕ ===== CRIAR EMPRESA =====');
  
  try {
    if (!pool) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Pool não disponível'
      });
    }
    
    const dados = req.body;
    console.log('📝 Dados recebidos para criação:', dados);
    
    const insertQuery = `
      INSERT INTO dados_empresas (
        razao_social,
        nome_oficina,
        cnpj,
        inscricao_estadual,
        email,
        endereco,
        numero,
        bairro,
        celular,
        cidade,
        estado,
        cep,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    
    const valores = [
      dados.razao_social || '',
      dados.nome_oficina || '',
      dados.cnpj || '',
      dados.inscricao_estadual || '',
      dados.email || '',
      dados.endereco || '',
      dados.numero || '',
      dados.bairro || '',
      dados.celular || '',
      dados.cidade || '',
      dados.estado || '',
      dados.cep || ''
    ];
    
    const result = await pool.query(insertQuery, valores);
    
    console.log('✅ Nova empresa criada:', result.rows[0]);
    console.log('===== FIM CRIAÇÃO =====\n');
    
    res.json({
      sucesso: true,
      empresa: result.rows[0],
      mensagem: 'Empresa criada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error.message);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

module.exports = router;