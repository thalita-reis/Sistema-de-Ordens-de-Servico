import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import orcamentoService from '../../services/orcamentoService';
import { formatDate, formatCurrency } from '../../utils/formatters';

function OrcamentoList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // ✅ CORREÇÃO 1: Estado inicial como array vazio em vez de undefined
  const [orcamentos, setOrcamentos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    orcamento: null,
  });

  // ✅ CORREÇÃO PRINCIPAL: Colunas com formato correto para cliente
  const columns = [
    { id: 'numero', label: 'Número', minWidth: 100 },
    { 
      id: 'cliente', 
      label: 'Cliente', 
      minWidth: 170,
      format: (value, row) => {
        // ✅ MÚLTIPLAS TENTATIVAS para garantir compatibilidade
        const nomeCliente = row.cliente_nome || 
                           row.cliente?.nome || 
                           row.nome_cliente || 
                           row.nomeCliente;
        
        console.log('🔍 Debug cliente:', { 
          numero: row.numero, 
          cliente_nome: row.cliente_nome,
          cliente_objeto: row.cliente,
          nomeCliente 
        });
        
        return nomeCliente || 'N/A';
      }
    },
    { 
      id: 'data_criacao', 
      label: 'Criação de dados', 
      minWidth: 130,
      format: formatDate
    },
    { 
      id: 'data_validade', 
      label: 'Validade', 
      minWidth: 130,
      format: formatDate
    },
    { 
      id: 'status', 
      label: 'Estado', 
      minWidth: 120,
      format: (value) => {
        const statusMap = {
          'pendente': 'Pendente',
          'aprovado': 'Aprovado',
          'rejeitado': 'Rejeitado',
          'expirado': 'Expirado'
        };
        return statusMap[value] || value;
      }
    },
    { 
      id: 'valor_total', 
      label: 'R$', 
      minWidth: 120,
      align: 'right',
      format: formatCurrency
    },
  ];

  useEffect(() => {
    carregarOrcamentos();
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page !== 0) {
        setPage(0);
      } else {
        carregarOrcamentos();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // ✅ CORREÇÃO 2: Função carregarOrcamentos com tratamento robusto
  const carregarOrcamentos = async () => {
    try {
      setLoading(true);
      console.log('🔍 OrcamentoList.carregarOrcamentos - Iniciando...');
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      console.log('📄 Parâmetros da busca:', params);

      const response = await orcamentoService.listar(params);
      
      console.log('📦 Resposta completa:', response);
      console.log('📊 response.data:', response.data);

      // ✅ CORREÇÃO 3: Tratamento robusto da resposta
      let orcamentosData = [];
      let totalData = 0;

      if (response && response.data) {
        // Caso 1: response.data.orcamentos (formato esperado)
        if (response.data.orcamentos && Array.isArray(response.data.orcamentos)) {
          orcamentosData = response.data.orcamentos;
          totalData = response.data.total || response.data.orcamentos.length;
          console.log('✅ Formato 1: response.data.orcamentos encontrado');
        }
        // Caso 2: response.data é array direto
        else if (Array.isArray(response.data)) {
          orcamentosData = response.data;
          totalData = response.data.length;
          console.log('✅ Formato 2: response.data como array direto');
        }
        // Caso 3: response.data.data (formato alternativo do backend)
        else if (response.data.data && Array.isArray(response.data.data)) {
          orcamentosData = response.data.data;
          totalData = response.data.total || response.data.data.length;
          console.log('✅ Formato 3: response.data.data encontrado');
        }
        // Caso 4: Fallback - dados existem mas estrutura diferente
        else {
          console.log('⚠️ Estrutura de dados não reconhecida:', response.data);
          orcamentosData = [];
          totalData = 0;
        }
      } else {
        console.log('❌ response ou response.data não existe');
        orcamentosData = [];
        totalData = 0;
      }

      console.log('✅ Dados extraídos:', {
        orcamentos: orcamentosData.length,
        total: totalData,
        primeiroOrcamento: orcamentosData[0] // Para debug
      });

      // ✅ CORREÇÃO 4: Sempre garantir que é array
      setOrcamentos(Array.isArray(orcamentosData) ? orcamentosData : []);
      setTotalCount(typeof totalData === 'number' ? totalData : 0);

    } catch (error) {
      console.error('❌ Erro ao carregar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
      
      // ✅ CORREÇÃO 5: Em caso de erro, garantir estado seguro
      setOrcamentos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (orcamento) => {
    navigate(`/orcamentos/${orcamento.id}`);
  };

  const handleEdit = (orcamento) => {
    navigate(`/orcamentos/${orcamento.id}/editar`);
  };

  const handleDelete = (orcamento) => {
    setDeleteDialog({ open: true, orcamento });
  };

  const confirmDelete = async () => {
    try {
      await orcamentoService.deletar(deleteDialog.orcamento.id);
      toast.success('Orçamento rejeitado com sucesso');
      carregarOrcamentos();
    } catch (error) {
      toast.error('Erro ao rejeitar orçamento');
      console.error(error);
    } finally {
      setDeleteDialog({ open: false, orcamento: null });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ CORREÇÃO 6: Verificação extra antes de renderizar DataTable
  console.log('🎯 Renderização - Estado atual:', {
    loading,
    orcamentos: orcamentos?.length || 0,
    isArray: Array.isArray(orcamentos),
    primeiroItem: orcamentos[0] // Para debug
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Orçamentos</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/orcamentos/novo')}
        >
          NOVO ORÇAMENTO
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Pesquisar por número ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendente">Pendente</MenuItem>
                <MenuItem value="aprovado">Aprovado</MenuItem>
                <MenuItem value="rejeitado">Rejeitado</MenuItem>
                <MenuItem value="expirado">Expirado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : (
        // ✅ CORREÇÃO 7: Verificação dupla antes de passar para DataTable
        <DataTable
          columns={columns}
          data={Array.isArray(orcamentos) ? orcamentos : []}
          totalCount={totalCount || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, orcamento: null })}
        onConfirm={confirmDelete}
        title="Rejeitar Orçamento"
        message={`Tem certeza que deseja rejeitar o orçamento ${deleteDialog.orcamento?.numero}?`}
      />
    </Box>
  );
}

export default OrcamentoList;