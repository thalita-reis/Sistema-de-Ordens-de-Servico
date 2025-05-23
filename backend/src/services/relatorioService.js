const ExcelJS = require('exceljs');
const path = require('path');
const { Cliente, OrdemServico, Orcamento } = require('../models');
const { Op } = require('sequelize');

class RelatorioService {
  async gerarRelatorioClientes(filtros = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'nome', width: 30 },
      { header: 'CPF', key: 'cpf', width: 15 },
      { header: 'Telefone', key: 'telefone', width: 15 },
      { header: 'Celular', key: 'celular', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Cidade', key: 'cidade', width: 20 },
      { header: 'Data Cadastro', key: 'data_inclusao', width: 15 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    // Buscar dados
    const clientes = await Cliente.findAll({
      where: filtros,
      order: [['nome', 'ASC']]
    });

    // Adicionar dados
    clientes.forEach(cliente => {
      worksheet.addRow({
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        celular: cliente.celular,
        email: cliente.email,
        cidade: cliente.cidade,
        data_inclusao: new Date(cliente.data_inclusao).toLocaleDateString('pt-BR'),
        status: cliente.ficha_inativa ? 'Inativo' : 'Ativo'
      });
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Salvar arquivo
    const filename = `relatorio_clientes_${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, '../../uploads', filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath };
  },

  async gerarRelatorioOrdensServico(filtros = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ordens de Serviço');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Número', key: 'numero', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Data Abertura', key: 'data_abertura', width: 15 },
      { header: 'Data Fechamento', key: 'data_fechamento', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Técnico', key: 'tecnico', width: 20 },
      { header: 'Valor Total', key: 'valor_total', width: 15 },
      { header: 'Descrição', key: 'descricao', width: 40 }
    ];

    // Buscar dados
    const ordens = await OrdemServico.findAll({
      where: filtros,
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['nome']
      }],
      order: [['created_at', 'DESC']]
    });

    // Adicionar dados
    ordens.forEach(ordem => {
      worksheet.addRow({
        numero: ordem.numero,
        cliente: ordem.cliente.nome,
        data_abertura: new Date(ordem.data_abertura).toLocaleDateString('pt-BR'),
        data_fechamento: ordem.data_fechamento ? new Date(ordem.data_fechamento).toLocaleDateString('pt-BR') : '-',
        status: ordem.status.toUpperCase(),
        tecnico: ordem.tecnico_responsavel || '-',
        valor_total: `R$ ${ordem.valor_total || '0,00'}`,
        descricao: ordem.descricao_problema
      });
    });

    // Estilizar
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Salvar arquivo
    const filename = `relatorio_os_${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, '../../uploads', filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath };
  },

  async gerarRelatorioOrcamentos(filtros = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orçamentos');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Número', key: 'numero', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Data Criação', key: 'data_criacao', width: 15 },
      { header: 'Validade', key: 'validade', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Valor Total', key: 'valor_total', width: 15 },
      { header: 'Descrição', key: 'descricao', width: 40 }
    ];

    // Buscar dados
    const orcamentos = await Orcamento.findAll({
      where: filtros,
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['nome']
      }],
      order: [['created_at', 'DESC']]
    });

    // Adicionar dados
    orcamentos.forEach(orcamento => {
      worksheet.addRow({
        numero: orcamento.numero,
        cliente: orcamento.cliente.nome,
        data_criacao: new Date(orcamento.data_criacao).toLocaleDateString('pt-BR'),
        validade: new Date(orcamento.data_validade).toLocaleDateString('pt-BR'),
        status: orcamento.status.toUpperCase(),
        valor_total: `R$ ${orcamento.valor_total || '0,00'}`,
        descricao: orcamento.descricao
      });
    });

    // Estilizar
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Salvar arquivo
    const filename = `relatorio_orcamentos_${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, '../../uploads', filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath };
  }
}

module.exports = new RelatorioService();