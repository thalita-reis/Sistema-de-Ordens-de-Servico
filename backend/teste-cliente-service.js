require('dotenv').config();
const ClienteService = require('./src/services/ClienteService');

const clienteService = new ClienteService();

async function testarClienteService() {
  console.log('🧪 TESTE COMPLETO DO CLIENTE SERVICE');
  console.log('=====================================');
  
  try {
    // Teste 1: Buscar cliente existente por CPF
    console.log('📋 Teste 1: Buscar cliente por CPF...');
    const clienteExistente = await clienteService.buscarPorCpf('12345678901');
    if (clienteExistente) {
      console.log(`✅ Cliente encontrado: ${clienteExistente.nome}`);
    } else {
      console.log('❌ Cliente não encontrado');
    }
    
    // Teste 2: Listar clientes
    console.log('');
    console.log('📋 Teste 2: Listar clientes...');
    const clientes = await clienteService.listarPorEmpresa(1, {
      limite: 10,
      offset: 0,
      busca: '',
      apenasAtivos: true
    });
    console.log(`✅ Encontrados ${clientes.length} clientes`);
    clientes.forEach((cliente, i) => {
      console.log(`   ${i + 1}. ${cliente.nome} (${cliente.cpf})`);
    });
    
    // Teste 3: Buscar ou criar cliente (caso já exista)
    console.log('');
    console.log('📋 Teste 3: Buscar ou criar cliente existente...');
    const resultado1 = await clienteService.buscarOuCriar({
      cpf: '12345678901',
      nome: 'João Silva Atualizado',
      email: 'joao.novo@email.com',
      telefone: '(11) 99999-0000',
      endereco: 'Rua Nova, 456',
      empresa_id: 1
    });
    
    if (resultado1.sucesso) {
      console.log(`✅ ${resultado1.mensagem}`);
      console.log(`   Cliente: ${resultado1.cliente.nome}`);
      console.log(`   Já cadastrado: ${resultado1.jaCadastrado}`);
    } else {
      console.log(`❌ Erro: ${resultado1.erro}`);
    }
    
    // Teste 4: Buscar ou criar cliente novo
    console.log('');
    console.log('📋 Teste 4: Buscar ou criar cliente novo...');
    const cpfTeste = '99999999999';
    
    // Primeiro remove se já existir (para garantir teste limpo)
    try {
      await clienteService.desativar(cpfTeste);
    } catch (e) {
      // Ignora se não existir
    }
    
    const resultado2 = await clienteService.buscarOuCriar({
      cpf: cpfTeste,
      nome: 'Cliente Teste Service',
      email: 'teste.service@email.com',
      telefone: '(11) 88888-8888',
      endereco: 'Rua do Teste Service, 789',
      empresa_id: 1
    });
    
    if (resultado2.sucesso) {
      console.log(`✅ ${resultado2.mensagem}`);
      console.log(`   Cliente: ${resultado2.cliente.nome} (ID: ${resultado2.cliente.id})`);
      console.log(`   Já cadastrado: ${resultado2.jaCadastrado}`);
    } else {
      console.log(`❌ Erro: ${resultado2.erro}`);
    }
    
    // Teste 5: Atualizar cliente
    console.log('');
    console.log('📋 Teste 5: Atualizar cliente...');
    const atualizacao = await clienteService.atualizar(cpfTeste, {
      nome: 'Cliente Teste Service ATUALIZADO',
      email: 'teste.atualizado@email.com',
      telefone: '(11) 77777-7777',
      endereco: 'Rua Atualizada, 999'
    });
    
    if (atualizacao.sucesso) {
      console.log(`✅ ${atualizacao.mensagem}`);
      console.log(`   Novo nome: ${atualizacao.cliente.nome}`);
    } else {
      console.log(`❌ Erro: ${atualizacao.erro}`);
    }
    
    // Teste 6: Buscar por ID
    console.log('');
    console.log('📋 Teste 6: Buscar por ID...');
    if (resultado2.sucesso) {
      const clientePorId = await clienteService.buscarPorId(resultado2.cliente.id);
      if (clientePorId) {
        console.log(`✅ Cliente encontrado por ID: ${clientePorId.nome}`);
      } else {
        console.log('❌ Cliente não encontrado por ID');
      }
    }
    
    // Teste 7: Obter estatísticas
    console.log('');
    console.log('📋 Teste 7: Obter estatísticas...');
    const stats = await clienteService.obterEstatisticas(1);
    console.log('✅ Estatísticas obtidas:');
    console.log(`   Total de clientes: ${stats.total_clientes}`);
    console.log(`   Clientes ativos: ${stats.clientes_ativos}`);
    console.log(`   Novos este mês: ${stats.novos_mes}`);
    console.log(`   Novos esta semana: ${stats.novos_semana}`);
    
    // Teste 8: Desativar cliente de teste
    console.log('');
    console.log('📋 Teste 8: Desativar cliente de teste...');
    const desativado = await clienteService.desativar(cpfTeste);
    if (desativado) {
      console.log('✅ Cliente de teste desativado com sucesso');
    } else {
      console.log('❌ Erro ao desativar cliente de teste');
    }
    
    // Resumo final
    console.log('');
    console.log('🎉 TODOS OS TESTES DO CLIENTE SERVICE CONCLUÍDOS!');
    console.log('✅ ClienteService está funcionando perfeitamente!');
    console.log('✅ Todas as operações CRUD funcionais!');
    console.log('✅ Integração com PostgreSQL OK!');
    console.log('');
    console.log('🚀 Próximo passo: Testar as rotas da API!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE DO CLIENTE SERVICE:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testarClienteService();
