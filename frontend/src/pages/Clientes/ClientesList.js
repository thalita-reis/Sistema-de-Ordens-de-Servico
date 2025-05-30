import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Paper,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { toast } from 'react-toastify';
import DataTable from '../../components/Common/DataTable';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import clienteService from '../../services/clienteService';
import { formatCPF, formatPhone, formatDate } from '../../utils/formatters';

function ClientesList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    cliente: null,
  });

  const columns = [
    { id: 'nome', label: 'NOME COMPLETO', minWidth: 170 },
    { id: 'cpf', label: 'CPF', minWidth: 130, format: formatCPF },
    { id: 'telefone', label: '📞 CELULAR', minWidth: 130, format: formatPhone },
    { id: 'email', label: '✉️ EMAIL', minWidth: 200 },
    { id: 'cidade', label: 'CIDADE', minWidth: 130 },
    {
      id: 'data_inclusao',
      label: 'DATA DE CADASTRO',
      minWidth: 130,
      format: formatDate,
    },
  ];

  useEffect(() => {
    carregarClientes();
  }, [page, rowsPerPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page !== 0) {
        setPage(0);
      } else {
        carregarClientes();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listar({
        page: page + 1,
        limit: rowsPerPage,
        search,
      });
      setClientes(response.data.clientes);
      setTotalCount(response.data.total);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (cliente) => {
    console.log('Visualizando cliente:', cliente);
    navigate(`/clientes/${cliente.id}`);
  };

  const handleEdit = (cliente) => {
    console.log('Editando cliente:', cliente);
    navigate(`/clientes/${cliente.id}/editar`);
  };

  const handleDelete = (cliente) => {
    console.log('Deletando cliente:', cliente);
    setDeleteDialog({ open: true, cliente });
  };

  const confirmDelete = async () => {
    try {
      await clienteService.deletar(deleteDialog.cliente.id);
      toast.success('Cliente excluído com sucesso');
      carregarClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
      console.error(error);
    } finally {
      setDeleteDialog({ open: false, cliente: null });
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
        <Typography variant="h4">🎯 CLIENTES 🎯</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/clientes/novo')}
        >
          ✨ NOVO CLIENTE ✨
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Pesquisar funcionando..."
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
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={clientes}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="🚫 Nenhum cliente encontrado"
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, cliente: null })}
        onConfirm={confirmDelete}
        title="🗑️ Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente ${deleteDialog.cliente?.nome}?`}
      />
    </Box>
  );
}

export default ClientesList;