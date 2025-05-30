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

  const columns = [
    { id: 'numero', label: 'Número', minWidth: 100 },
    { 
      id: 'cliente', 
      label: 'Cliente', 
      minWidth: 170,
      format: (value, row) => row.cliente?.nome || 'N/A'
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

  const carregarOrcamentos = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await orcamentoService.listar(params);
      setOrcamentos(response.data.orcamentos);
      setTotalCount(response.data.total);
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
      console.error(error);
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
        <DataTable
          columns={columns}
          data={orcamentos}
          totalCount={totalCount}
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