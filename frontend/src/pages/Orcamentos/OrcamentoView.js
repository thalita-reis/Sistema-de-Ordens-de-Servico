import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit,
  Print,
  ArrowBack,
  Person,
  CalendarToday,
  AttachMoney,
  DirectionsCar,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import orcamentoService from '../../services/orcamentoService';
// import dadosEmpresaService from '../../services/dadosEmpresaService'; // Vamos usar API direta por enquanto
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function OrcamentoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orcamento, setOrcamento] = useState(null);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar orçamento e dados da empresa em paralelo
      const [orcamentoResponse, empresaResponse] = await Promise.all([
        orcamentoService.buscarPorId(id),
        carregarDadosEmpresa()
      ]);
      
      setOrcamento(orcamentoResponse.data);
      setDadosEmpresa(empresaResponse);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      navigate('/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosEmpresa = async () => {
    try {
      console.log('🔍 Buscando dados da empresa...');
      
      // Pegar token do localStorage (mesmo jeito que outros services usam)
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ Token não encontrado');
        return null;
      }
      
      const response = await fetch('http://localhost:3001/api/dados-empresa', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados da empresa recebidos:', data);
        return data;
      } else {
        console.log('❌ Response não OK:', response.status);
        return null;
      }
    } catch (error) {
      console.log('💥 Erro ao carregar dados da empresa:', error);
      return null;
    }
  };

  const formatarDadosEmpresa = (dados) => {
    if (!dados) {
      return {
        nome: 'NOME DA SUA OFICINA',
        endereco: 'Rua Exemplo, 123 - Bairro - Cidade/UF',
        telefone: '(11) 9999-9999',
        email: 'contato@oficina.com.br',
        cnpj: '00.000.000/0001-00'
      };
    }

    // Montar endereço completo
    const enderecoCompleto = [
      dados.endereco || dados.rua,
      dados.numero,
      dados.bairro,
      dados.cidade,
      dados.uf
    ].filter(item => item).join(', ');

    return {
      nome: dados.nome_oficina || dados.razao_social || 'NOME DA SUA OFICINA',
      endereco: enderecoCompleto || 'Endereço não cadastrado',
      telefone: dados.telefone || dados.celular || '(11) 9999-9999',
      email: dados.email || 'contato@oficina.com.br',
      cnpj: dados.cnpj || dados.inscricao_estadual || '00.000.000/0001-00'
    };
  };

  const generatePrintHTML = (orcamento) => {
    const valorFinal = orcamento.valor_total - (orcamento.total_desconto || 0);
    const empresa = formatarDadosEmpresa(dadosEmpresa);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Orçamento #${orcamento.numero}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
          }
          
          .container {
            width: 100%;
            max-width: 180mm;
            margin: 0 auto;
          }
          
          /* Cabeçalho */
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #0066cc;
          }
          
          .header h1 {
            font-size: 20pt;
            color: #0066cc;
            margin-bottom: 5px;
          }
          
          .header-info {
            font-size: 9pt;
            color: #666;
            line-height: 1.3;
          }
          
          /* Título com status */
          .title-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .title {
            font-size: 16pt;
            font-weight: bold;
          }
          
          .status {
            background: #ff4444;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: bold;
          }
          
          .status.aprovado { background: #44aa44; }
          .status.pendente { background: #ff9944; }
          
          /* Seções */
          .section {
            margin-bottom: 15px;
          }
          
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #0066cc;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 3px;
            margin-bottom: 10px;
          }
          
          /* Layout em duas colunas */
          .two-columns {
            display: table;
            width: 100%;
            margin-bottom: 15px;
          }
          
          .column {
            display: table-cell;
            width: 50%;
            padding-right: 20px;
            vertical-align: top;
          }
          
          .column:last-child {
            padding-right: 0;
            padding-left: 20px;
          }
          
          /* Info boxes */
          .info-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          
          .info-label {
            font-size: 9pt;
            color: #666;
            min-width: 80px;
          }
          
          .info-value {
            font-size: 10pt;
            color: #333;
            font-weight: 500;
          }
          
          /* Tabela */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9pt;
          }
          
          th {
            background: #0066cc;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
          }
          
          td {
            border: 1px solid #ddd;
            padding: 6px 8px;
          }
          
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          /* Totais */
          .totals-section {
            margin-top: 15px;
            text-align: right;
          }
          
          .total-row {
            display: inline-block;
            margin-left: 20px;
          }
          
          .total-label {
            font-weight: bold;
            margin-right: 10px;
          }
          
          .total-value {
            font-weight: bold;
            color: #0066cc;
          }
          
          .grand-total {
            font-size: 12pt;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 2px solid #0066cc;
          }
          
          /* Assinaturas */
          .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 40%;
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
          }
          
          .signature-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .signature-role {
            font-size: 9pt;
            color: #666;
          }
          
          /* Descrições */
          .description-box {
            background: #f5f5f5;
            padding: 10px;
            margin: 10px 0;
            border-left: 3px solid #0066cc;
          }
          
          .description-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #0066cc;
          }
          
          @media print {
            body { margin: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <h1>${empresa.nome}</h1>
            <div class="header-info">
              Endereço: ${empresa.endereco}<br>
              Telefone: ${empresa.telefone} | E-mail: ${empresa.email}<br>
              CNPJ: ${empresa.cnpj}
            </div>
          </div>
          
          <!-- Título com Status -->
          <div class="title-section">
            <div class="title">Orçamento #${orcamento.numero}</div>
            <div class="status ${orcamento.status}">${orcamento.status.toUpperCase()}</div>
          </div>
          
          <!-- Duas Colunas -->
          <div class="two-columns">
            <!-- Coluna Esquerda -->
            <div class="column">
              <!-- Informações do Orçamento -->
              <div class="section">
                <div class="section-title">Informações do Orçamento</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Número:</span>
                    <span class="info-value">#${orcamento.numero}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Data:</span>
                    <span class="info-value">${formatDate(orcamento.data_criacao)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Validade:</span>
                    <span class="info-value">${formatDate(orcamento.data_validade)}</span>
                  </div>
                </div>
              </div>
              
              <!-- Dados do Veículo -->
              <div class="section">
                <div class="section-title">Dados do Veículo</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Placa:</span>
                    <span class="info-value">${orcamento.placa || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Montadora:</span>
                    <span class="info-value">${orcamento.montadora || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Veículo:</span>
                    <span class="info-value">${orcamento.veiculo || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Modelo:</span>
                    <span class="info-value">${orcamento.modelo || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Ano:</span>
                    <span class="info-value">${orcamento.ano || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Motor:</span>
                    <span class="info-value">${orcamento.motor || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Combustível:</span>
                    <span class="info-value">${orcamento.combustivel || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Odômetro:</span>
                    <span class="info-value">${orcamento.odometro || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Tanque:</span>
                    <span class="info-value">${orcamento.tanque || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Coluna Direita -->
            <div class="column">
              <!-- Dados do Cliente -->
              <div class="section">
                <div class="section-title">Dados do Cliente</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-value" style="font-weight: bold;">${orcamento.cliente?.nome}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">CPF:</span>
                    <span class="info-value">${orcamento.cliente?.cpf || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Telefone:</span>
                    <span class="info-value">${orcamento.cliente?.telefone || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${orcamento.cliente?.email || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Endereço:</span>
                    <span class="info-value">
                      ${orcamento.cliente?.rua || ''} ${orcamento.cliente?.numero || ''}<br>
                      ${orcamento.cliente?.bairro || ''} - ${orcamento.cliente?.cidade || ''}/${orcamento.cliente?.uf || ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Descrições -->
              ${orcamento.descricao_problema ? `
              <div class="section">
                <div class="section-title">Descrições</div>
                <div class="description-box">
                  <div class="description-title">Descrição do Problema:</div>
                  <div>${orcamento.descricao_problema}</div>
                </div>
                ${orcamento.descricao_servico ? `
                <div class="description-box">
                  <div class="description-title">Descrição do Serviço:</div>
                  <div>${orcamento.descricao_servico}</div>
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Itens do Orçamento -->
          <div class="section">
            <div class="section-title">Itens do Orçamento</div>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-center" width="100">Quantidade</th>
                  <th class="text-right" width="120">Valor Unitário</th>
                  <th class="text-right" width="120">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orcamento.itens && orcamento.itens.length > 0 ? 
                  orcamento.itens.map(item => `
                    <tr>
                      <td>${item.descricao}</td>
                      <td class="text-center">${item.quantidade}</td>
                      <td class="text-right">${formatCurrency(item.valor)}</td>
                      <td class="text-right">${formatCurrency(item.valor * item.quantidade)}</td>
                    </tr>
                  `).join('') : 
                  '<tr><td colspan="4" class="text-center">Nenhum item cadastrado</td></tr>'
                }
              </tbody>
            </table>
            
            <!-- Totais -->
            <div class="totals-section">
              ${orcamento.condicao_pagamento ? `
                <div style="float: left; text-align: left;">
                  <strong>Condição de Pagamento:</strong> ${orcamento.condicao_pagamento}<br>
                  ${orcamento.garantia_servico ? `<strong>Garantia:</strong> ${orcamento.garantia_servico}` : ''}
                </div>
              ` : ''}
              
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">${formatCurrency(orcamento.valor_total)}</span>
              </div>
              
              ${orcamento.total_desconto > 0 ? `
              <div class="total-row">
                <span class="total-label">Desconto:</span>
                <span class="total-value" style="color: red;">- ${formatCurrency(orcamento.total_desconto)}</span>
              </div>
              ` : ''}
              
              <div class="total-row grand-total">
                <span class="total-label">Total:</span>
                <span class="total-value" style="font-size: 14pt;">${formatCurrency(valorFinal)}</span>
              </div>
            </div>
          </div>
          
          ${orcamento.observacoes ? `
          <div class="section">
            <div class="section-title">Observações</div>
            <div class="description-box">
              ${orcamento.observacoes}
            </div>
          </div>
          ` : ''}
          
          <!-- Assinaturas -->
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${orcamento.cliente?.nome}</div>
                <div class="signature-role">Cliente</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">Responsável da Oficina</div>
                <div class="signature-role">Oficina</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleProfessionalPrint = () => {
    const printContent = generatePrintHTML(orcamento);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  const handlePrint = () => {
    // Criar estilos ultra-compactos para uma página A4
    const printStyles = `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Esconder tudo exceto o conteúdo principal */
        body > *:not(#root),
        #root > *:not(div),
        .MuiAppBar-root,
        .MuiDrawer-root,
        header,
        nav,
        button {
          display: none !important;
        }
        
        /* Configuração do body */
        html, body {
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 9pt !important;
          overflow: hidden !important;
        }
        
        /* Container principal - uma página */
        #orcamento-print {
          width: 190mm !important;
          max-height: 277mm !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          page-break-after: avoid !important;
          overflow: hidden !important;
        }
        
        /* Cabeçalho super compacto */
        .print-header {
          display: block !important;
          text-align: center !important;
          padding: 0 0 3mm 0 !important;
          margin: 0 0 3mm 0 !important;
          border-bottom: 1px solid #1976d2 !important;
        }
        
        .print-header h1 {
          font-size: 14pt !important;
          margin: 0 0 1mm 0 !important;
          padding: 0 !important;
          color: #1976d2 !important;
        }
        
        .print-header p {
          font-size: 8pt !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.1 !important;
        }
        
        /* Remover título duplicado */
        #orcamento-print > .MuiTypography-h4 {
          display: none !important;
        }
        
        /* Grid como flexbox horizontal */
        .MuiGrid-container {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 3mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .MuiGrid-item {
          flex: 1 1 45% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Papers ultra compactos */
        .MuiPaper-root {
          border: 1px solid #ccc !important;
          padding: 3mm !important;
          margin: 0 0 3mm 0 !important;
          box-shadow: none !important;
          page-break-inside: avoid !important;
        }
        
        /* Títulos menores */
        .MuiTypography-h6 {
          font-size: 9pt !important;
          font-weight: bold !important;
          margin: 0 0 2mm 0 !important;
          padding: 0 0 1mm 0 !important;
          border-bottom: 1px solid #1976d2 !important;
          color: #1976d2 !important;
        }
        
        /* Textos compactos */
        .MuiTypography-body1,
        .MuiTypography-body2 {
          font-size: 8pt !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Status no canto */
        .MuiChip-root {
          position: absolute !important;
          top: 5mm !important;
          right: 10mm !important;
          font-size: 8pt !important;
          padding: 1mm 3mm !important;
          height: auto !important;
        }
        
        /* Dados lado a lado */
        .MuiGrid-item .MuiGrid-container {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 2mm !important;
        }
        
        .MuiGrid-item .MuiGrid-item {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Tabela compacta */
        table {
          width: 100% !important;
          font-size: 7pt !important;
          border-collapse: collapse !important;
          margin: 2mm 0 !important;
        }
        
        th, td {
          border: 1px solid #ccc !important;
          padding: 1mm 2mm !important;
          line-height: 1.1 !important;
        }
        
        th {
          background: #1976d2 !important;
          color: white !important;
          font-weight: bold !important;
        }
        
        /* Seção de totais inline */
        .total-section {
          display: flex !important;
          justify-content: flex-end !important;
          gap: 5mm !important;
          font-size: 8pt !important;
          margin: 2mm 0 !important;
        }
        
        /* Esconder ícones */
        .MuiSvgIcon-root {
          display: none !important;
        }
        
        /* Divisores */
        .MuiDivider-root {
          display: none !important;
        }
        
        /* Assinaturas fixas no rodapé */
        .print-signature {
          display: flex !important;
          justify-content: space-between !important;
          position: absolute !important;
          bottom: 5mm !important;
          left: 0 !important;
          right: 0 !important;
          padding: 0 !important;
        }
        
        .signature-box {
          width: 40% !important;
          text-align: center !important;
        }
        
        .signature-line {
          border-top: 1px solid #333 !important;
          margin: 5mm 0 0 0 !important;
          padding: 2mm 0 0 0 !important;
        }
        
        .signature-box p {
          font-size: 8pt !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Forçar conteúdo em uma página */
        #orcamento-print > div {
          max-height: 240mm !important;
          overflow: hidden !important;
        }
        
        /* Última seção com margem para assinaturas */
        #orcamento-print > div > div:last-of-type {
          margin-bottom: 30mm !important;
        }
        
        /* Compactar descrições e observações */
        .MuiPaper-root:has(p[style*="pre-wrap"]) {
          max-height: 30mm !important;
          overflow: hidden !important;
        }
        
        /* Layout em duas colunas para dados */
        .two-columns {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 5mm !important;
        }
      }
    `;
    
    // Adicionar estilos
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    // Forçar renderização antes de imprimir
    setTimeout(() => {
      // Adicionar classe temporária para ajudar no layout
      document.getElementById('orcamento-print').classList.add('printing');
      
      window.print();
      
      // Limpar após impressão
      setTimeout(() => {
        document.getElementById('orcamento-print').classList.remove('printing');
        document.head.removeChild(styleElement);
      }, 1000);
    }, 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pendente': 'warning',
      'aprovado': 'success',
      'rejeitado': 'error',
      'expirado': 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'expirado': 'Expirado'
    };
    return labels[status] || status;
  };

  const getTanqueLabel = (tanque) => {
    const labels = {
      'vazio': 'Vazio',
      '1/4': '1/4',
      '1/2': '1/2',
      '3/4': '3/4',
      'cheio': 'Cheio'
    };
    return labels[tanque] || tanque;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!orcamento) {
    return null;
  }

  const valorFinal = orcamento.valor_total - (orcamento.total_desconto || 0);
  const empresa = formatarDadosEmpresa(dadosEmpresa);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Orçamento #{orcamento.numero}</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/orcamentos')}
          >
            VOLTAR
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handleProfessionalPrint}
            sx={{ 
              color: '#1976d2',
              borderColor: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            IMPRIMIR
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/orcamentos/${id}/editar`)}
          >
            EDITAR
          </Button>
        </Box>
      </Box>

      <div id="orcamento-print">
        {/* Cabeçalho da empresa - só aparece na impressão */}
        <Box className="print-header" sx={{ display: 'none' }}>
          <style>
            {`
              @media print {
                .print-header {
                  display: block !important;
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #1976d2;
                }
                .print-header h1 {
                  margin: 0;
                  font-size: 28pt;
                  color: #1976d2;
                }
                .print-header p {
                  margin: 5px 0;
                  font-size: 12pt;
                  color: #666;
                }
              }
            `}
          </style>
          <h1>{empresa.nome}</h1>
          <p>Endereço: {empresa.endereco}</p>
          <p>Telefone: {empresa.telefone} | E-mail: {empresa.email}</p>
          <p>CNPJ: {empresa.cnpj}</p>
        </Box>

        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Orçamento #{orcamento.numero}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Informações do Orçamento</Typography>
                <Chip
                  label={getStatusLabel(orcamento.status)}
                  color={getStatusColor(orcamento.status)}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Número do Orçamento
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    #{orcamento.numero}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Data de Criação
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(orcamento.data_criacao)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Validade
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(orcamento.data_validade)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Dados do Cliente */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dados do Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person fontSize="small" color="action" />
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {orcamento.cliente?.nome}
                  </Typography>
                  {orcamento.cliente?.cpf && (
                    <Typography variant="body2" color="textSecondary">
                      CPF: {orcamento.cliente.cpf}
                    </Typography>
                  )}
                  {orcamento.cliente?.telefone && (
                    <Typography variant="body2" color="textSecondary">
                      Tel: {orcamento.cliente.telefone}
                    </Typography>
                  )}
                  {orcamento.cliente?.email && (
                    <Typography variant="body2" color="textSecondary">
                      {orcamento.cliente.email}
                    </Typography>
                  )}
                  {orcamento.cliente?.rua && (
                    <Typography variant="body2" color="textSecondary">
                      {orcamento.cliente.rua}, {orcamento.cliente.numero} 
                      {orcamento.cliente.complemento && ` - ${orcamento.cliente.complemento}`}
                      {orcamento.cliente.bairro && ` - ${orcamento.cliente.bairro}`}
                      {orcamento.cliente.cidade && ` - ${orcamento.cliente.cidade}`}
                      {orcamento.cliente.uf && `/${orcamento.cliente.uf}`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Dados do Veículo */}
          {(orcamento.placa || orcamento.veiculo || orcamento.montadora) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <DirectionsCar fontSize="small" color="action" />
                  <Typography variant="h6">Dados do Veículo</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {orcamento.placa && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Placa
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.placa}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.montadora && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Montadora
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.montadora}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.veiculo && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Veículo
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.veiculo}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.modelo && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Modelo
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.modelo}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.ano && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Ano
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.ano}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.motor && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Motor
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.motor}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.combustivel && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Combustível
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.combustivel}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.odometro && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Odômetro
                      </Typography>
                      <Typography variant="body1">
                        {orcamento.odometro}
                      </Typography>
                    </Grid>
                  )}
                  
                  {orcamento.tanque && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Tanque
                      </Typography>
                      <Typography variant="body1">
                        {getTanqueLabel(orcamento.tanque)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Descrições */}
          {(orcamento.descricao_problema || orcamento.descricao_servico) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Descrições
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {orcamento.descricao_problema && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Descrição do Problema:
                    </Typography>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {orcamento.descricao_problema}
                    </Typography>
                  </Box>
                )}
                
                {orcamento.descricao_servico && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Descrição do Serviço Realizado:
                    </Typography>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {orcamento.descricao_servico}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Itens do Orçamento */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Itens do Orçamento
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="center">Quantidade</TableCell>
                      <TableCell align="right">Valor Unitário</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orcamento.itens && orcamento.itens.length > 0 ? (
                      orcamento.itens.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">{formatCurrency(item.valor)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.valor * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Nenhum item cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {orcamento.condicao_pagamento && (
                      <Typography variant="body2">
                        <strong>Condição de Pagamento:</strong> {orcamento.condicao_pagamento}
                      </Typography>
                    )}
                    {orcamento.garantia_servico && (
                      <Typography variant="body2">
                        <strong>Garantia do Serviço:</strong> {orcamento.garantia_servico}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box className="total-section" display="flex" justifyContent="flex-end">
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={3}>
                          <Typography variant="body2">
                            <strong>Subtotal:</strong> {formatCurrency(orcamento.valor_total)}
                          </Typography>
                          {orcamento.total_desconto > 0 && (
                            <Typography variant="body2" color="error">
                              <strong>Desconto:</strong> - {formatCurrency(orcamento.total_desconto)}
                            </Typography>
                          )}
                          <Typography variant="h6" color="primary">
                            <strong>Total:</strong> {formatCurrency(valorFinal)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {orcamento.observacoes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Observações:
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {orcamento.observacoes}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Área de assinatura - só aparece na impressão */}
        <Box className="print-signature" sx={{ display: 'none' }}>
          <style>
            {`
              @media print {
                .print-signature {
                  display: flex !important;
                  justify-content: space-around;
                  margin-top: 80px;
                  padding-top: 20px;
                }
                .signature-box {
                  text-align: center;
                  width: 40%;
                }
                .signature-line {
                  border-top: 1px solid #333;
                  margin-top: 60px;
                  padding-top: 10px;
                }
                .signature-box p {
                  margin: 0;
                  font-size: 11pt;
                }
              }
            `}
          </style>
          <div className="signature-box">
            <div className="signature-line">
              <p><strong>{orcamento.cliente?.nome}</strong></p>
              <p>Cliente</p>
            </div>
          </div>
          <div className="signature-box">
            <div className="signature-line">
              <p><strong>Responsável da Oficina</strong></p>
              <p>Oficina</p>
            </div>
          </div>
        </Box>
      </div>
    </Box>
  );
}

export default OrcamentoView;