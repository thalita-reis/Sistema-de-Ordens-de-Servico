const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { DadosEmpresa } = require('../models');

class PDFService {
  async gerarPDFCliente(cliente) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filename = `cliente_${cliente.id}_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../../uploads', filename);

        doc.pipe(fs.createWriteStream(filepath));

        // Cabeçalho
        doc.fontSize(20).text('Ficha de Cliente', { align: 'center' });
        doc.moveDown();

        // Dados do cliente
        doc.fontSize(12);
        doc.text(`Nome: ${cliente.nome}`);
        doc.text(`CPF: ${cliente.cpf || 'Não informado'}`);
        doc.text(`RG: ${cliente.rg || 'Não informado'}`);
        doc.text(`Data de Inclusão: ${new Date(cliente.data_inclusao).toLocaleDateString('pt-BR')}`);
        doc.moveDown();

        doc.text('Contatos:', { underline: true });
        doc.text(`Telefone: ${cliente.telefone || 'Não informado'}`);
        doc.text(`Celular: ${cliente.celular || 'Não informado'}`);
        doc.text(`Email: ${cliente.email || 'Não informado'}`);
        doc.moveDown();

        doc.text('Endereço:', { underline: true });
        doc.text(`${cliente.rua || ''} ${cliente.numero || ''}`);
        doc.text(`Bairro: ${cliente.bairro || 'Não informado'}`);
        doc.text(`Cidade: ${cliente.cidade || 'Não informado'} - ${cliente.uf || ''}`);
        doc.text(`CEP: ${cliente.cep || 'Não informado'}`);

        if (cliente.observacoes_gerais) {
          doc.moveDown();
          doc.text('Observações:', { underline: true });
          doc.text(cliente.observacoes_gerais);
        }

        doc.end();

        resolve({ filename, filepath });
      } catch (error) {
        reject(error);
      }
    });
  },

  async gerarPDFOrdemServico(ordem) {
    return new Promise(async (resolve, reject) => {
      try {
        // Buscar dados da empresa
        const dadosEmpresa = await DadosEmpresa.findOne();
        
        const doc = new PDFDocument();
        const filename = `os_${ordem.numero}_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../../uploads', filename);

        doc.pipe(fs.createWriteStream(filepath));

        // Cabeçalho da empresa
        if (dadosEmpresa) {
          doc.fontSize(18).text(dadosEmpresa.nome_oficina || dadosEmpresa.razao_social || 'NOME DA SUA OFICINA', { align: 'center' });
          doc.fontSize(10);
          if (dadosEmpresa.endereco) {
            doc.text(`${dadosEmpresa.endereco}, ${dadosEmpresa.numero || ''} - ${dadosEmpresa.bairro || ''} - ${dadosEmpresa.cidade || ''} - ${dadosEmpresa.uf || ''}`, { align: 'center' });
          }
          if (dadosEmpresa.cep) {
            doc.text(`CEP: ${dadosEmpresa.cep}`, { align: 'center' });
          }
          if (dadosEmpresa.telefone || dadosEmpresa.celular) {
            doc.text(`Tel: ${dadosEmpresa.telefone || dadosEmpresa.celular}`, { align: 'center' });
          }
          if (dadosEmpresa.email) {
            doc.text(`Email: ${dadosEmpresa.email}`, { align: 'center' });
          }
          if (dadosEmpresa.cnpj) {
            doc.text(`CNPJ: ${dadosEmpresa.cnpj}`, { align: 'center' });
          }
        }
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Título do documento
        doc.fontSize(20).text('Ordem de Serviço', { align: 'center' });
        doc.fontSize(16).text(`Nº ${ordem.numero}`, { align: 'center' });
        doc.moveDown();

        // Dados da OS
        doc.fontSize(12);
        doc.text(`Data de Abertura: ${new Date(ordem.data_abertura).toLocaleDateString('pt-BR')}`);
        doc.text(`Status: ${ordem.status.toUpperCase()}`);
        doc.text(`Técnico Responsável: ${ordem.tecnico_responsavel || 'Não definido'}`);
        doc.moveDown();

        // Dados do cliente
        doc.text('Cliente:', { underline: true });
        doc.text(`Nome: ${ordem.cliente.nome}`);
        doc.text(`Telefone: ${ordem.cliente.telefone || ordem.cliente.celular || 'Não informado'}`);
        doc.moveDown();

        // Descrição do problema
        doc.text('Descrição do Problema:', { underline: true });
        doc.text(ordem.descricao_problema || 'Não informado');
        doc.moveDown();

        // Serviços realizados
        doc.text('Serviços Realizados:', { underline: true });
        doc.text(ordem.descricao_servico || 'Não informado');
        doc.moveDown();

        // Valor
        doc.text(`Valor Total: R$ ${ordem.valor_total || '0,00'}`);

        if (ordem.observacoes) {
          doc.moveDown();
          doc.text('Observações:', { underline: true });
          doc.text(ordem.observacoes);
        }

        doc.end();

        resolve({ filename, filepath });
      } catch (error) {
        reject(error);
      }
    });
  },

  async gerarPDFOrcamento(orcamento) {
    return new Promise(async (resolve, reject) => {
      try {
        // Buscar dados da empresa
        const dadosEmpresa = await DadosEmpresa.findOne();
        
        const doc = new PDFDocument();
        const filename = `orcamento_${orcamento.numero}_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../../uploads', filename);

        doc.pipe(fs.createWriteStream(filepath));

        // Cabeçalho da empresa
        if (dadosEmpresa) {
          // Nome da empresa em destaque
          doc.fontSize(18)
             .text(dadosEmpresa.nome_oficina || dadosEmpresa.razao_social || 'NOME DA SUA OFICINA', { 
               align: 'center',
               underline: true 
             });
          
          doc.moveDown(0.5);
          
          // Informações da empresa
          doc.fontSize(10);
          
          // Endereço completo
          if (dadosEmpresa.endereco) {
            const enderecoCompleto = [
              dadosEmpresa.endereco,
              dadosEmpresa.numero,
              dadosEmpresa.bairro,
              dadosEmpresa.cidade,
              dadosEmpresa.uf
            ].filter(item => item).join(', ');
            
            doc.text(enderecoCompleto, { align: 'center' });
          }
          
          // CEP
          if (dadosEmpresa.cep) {
            doc.text(`CEP: ${dadosEmpresa.cep}`, { align: 'center' });
          }
          
          // Contatos
          const contatos = [];
          if (dadosEmpresa.telefone) contatos.push(`Tel: ${dadosEmpresa.telefone}`);
          if (dadosEmpresa.celular && dadosEmpresa.celular !== dadosEmpresa.telefone) {
            contatos.push(`Cel: ${dadosEmpresa.celular}`);
          }
          if (contatos.length > 0) {
            doc.text(contatos.join(' - '), { align: 'center' });
          }
          
          // Email
          if (dadosEmpresa.email) {
            doc.text(`Email: ${dadosEmpresa.email}`, { align: 'center' });
          }
          
          // CNPJ/Inscrição
          const documentos = [];
          if (dadosEmpresa.cnpj) documentos.push(`CNPJ: ${dadosEmpresa.cnpj}`);
          if (dadosEmpresa.inscricao_estadual) documentos.push(`I.E.: ${dadosEmpresa.inscricao_estadual}`);
          if (documentos.length > 0) {
            doc.text(documentos.join(' - '), { align: 'center' });
          }
        } else {
          // Fallback caso não tenha dados da empresa
          doc.fontSize(18).text('NOME DA SUA OFICINA', { align: 'center', underline: true });
        }
        
        // Linha separadora
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Título do documento
        doc.fontSize(20).text('Orçamento', { align: 'center' });
        doc.fontSize(16).text(`Nº ${orcamento.numero}`, { align: 'center' });
        doc.moveDown();

        // Informações do orçamento
        doc.fontSize(12);
        
        // Caixa com informações do orçamento
        const startY = doc.y;
        doc.rect(50, startY, 250, 60).stroke();
        doc.text('Informações do Orçamento', 60, startY + 10, { underline: true });
        doc.text(`Data: ${new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}`, 60, startY + 25);
        doc.text(`Validade: ${new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}`, 60, startY + 40);
        
        // Caixa com dados do cliente
        doc.rect(320, startY, 250, 60).stroke();
        doc.text('Dados do Cliente', 330, startY + 10, { underline: true });
        doc.text(`Nome: ${orcamento.cliente.nome}`, 330, startY + 25);
        doc.text(`Telefone: ${orcamento.cliente.telefone || orcamento.cliente.celular || 'Não informado'}`, 330, startY + 40);
        
        doc.y = startY + 80;
        doc.moveDown();

        // Descrição dos serviços
        doc.text('Descrição dos Serviços:', { underline: true });
        doc.text(orcamento.descricao || 'Não informado');
        doc.moveDown();

        // Tabela de itens (se existir)
        if (orcamento.itens && orcamento.itens.length > 0) {
          doc.text('Itens do Orçamento:', { underline: true });
          doc.moveDown(0.5);
          
          // Cabeçalho da tabela
          const tableTop = doc.y;
          doc.rect(50, tableTop, 500, 20).stroke();
          doc.text('Item', 60, tableTop + 5);
          doc.text('Qtd', 250, tableTop + 5);
          doc.text('Valor Unit.', 300, tableTop + 5);
          doc.text('Valor Total', 400, tableTop + 5);
          
          let currentY = tableTop + 20;
          
          orcamento.itens.forEach((item, index) => {
            doc.rect(50, currentY, 500, 20).stroke();
            doc.text(`${index + 1}. ${item.descricao}`, 60, currentY + 5);
            doc.text(item.quantidade.toString(), 250, currentY + 5);
            doc.text(`R$ ${item.valor_unitario || item.valor}`, 300, currentY + 5);
            doc.text(`R$ ${(item.quantidade * (item.valor_unitario || item.valor)).toFixed(2)}`, 400, currentY + 5);
            currentY += 20;
          });
          
          doc.y = currentY + 10;
        }

        // Valor total em destaque
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`Valor Total: R$ ${orcamento.valor_total || '0,00'}`, { align: 'right' });
        doc.font('Helvetica').fontSize(12);

        // Observações
        if (orcamento.observacoes) {
          doc.moveDown();
          doc.text('Observações:', { underline: true });
          doc.text(orcamento.observacoes);
        }

        // Rodapé
        doc.moveDown(2);
        doc.fontSize(10);
        doc.text('Este orçamento tem validade conforme data especificada acima.', { align: 'center' });
        doc.text('Serviços sujeitos à aprovação e disponibilidade de peças.', { align: 'center' });

        doc.end();

        resolve({ filename, filepath });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();