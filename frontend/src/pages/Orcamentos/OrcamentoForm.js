import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
import { Save, Cancel, Add as AddIcon, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import orcamentoService from '../../services/orcamentoService';
import clienteService from '../../services/clienteService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

function OrcamentoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({
    descricao: '',
    quantidade: 1,
    valor: '',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      cliente_id: null,
      status: 'pendente',
      data_validade: '',
      // Dados do veículo
      placa: '',
      odometro: '',
      tanque: 'vazio',
      montadora: '',
      veiculo: '',
      combustivel: '',
      ano: '',
      motor: '',
      modelo: '',
      // Dados do serviço
      descricao_problema: '',
      descricao_servico: '',
      condicao_pagamento: '',
      garantia_servico: '',
      total_desconto: 0,
      observacoes: '',
    },
  });

  const totalDesconto = watch('total_desconto');

  useEffect(() => {
    carregarClientes();
    if (isEdit) {
      carregarOrcamento();
    } else {
      // Define validade padrão para 30 dias
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 30);
      setValue('data_validade', dataValidade.toISOString().split('T')[0]);
    }
  }, [id]);

  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await clienteService.listar({ limit: 1000 });
      setClientes(response.data.clientes);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const carregarOrcamento = async () => {
    try {
      setLoading(true);
      const response = await orcamentoService.buscarPorId(id);
      const orcamento = response.data;
      
      // Carregar todos os campos
      Object.keys(orcamento).forEach(key => {
        if (key === 'data_validade') {
          setValue(key, orcamento[key].split('T')[0]);
        } else if (key !== 'itens' && key !== 'createdAt' && key !== 'updatedAt') {
          setValue(key, orcamento[key] || '');
        }
      });
      
      if (orcamento.itens && orcamento.itens.length > 0) {
        setItens(orcamento.itens);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamento');
      navigate('/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || !novoItem.valor) {
      toast.warning('Preencha a descrição e o valor do item');
      return;
    }

    setItens([...itens, {
      ...novoItem,
      valor: parseFloat(novoItem.valor),
      subtotal: parseFloat(novoItem.valor) * parseInt(novoItem.quantidade)
    }]);

    setNovoItem({
      descricao: '',
      quantidade: 1,
      valor: '',
    });
  };

  const removerItem = (index) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  };

  const calcularTotalComDesconto = () => {
    const total = calcularTotal();
    const desconto = parseFloat(totalDesconto) || 0;
    return total - desconto;
  };

  const onSubmit = async (data) => {
    try {
      if (itens.length === 0) {
        toast.warning('Adicione pelo menos um item ao orçamento');
        return;
      }

      setLoading(true);
      
      const dadosOrcamento = {
        ...data,
        itens,
        valor_total: calcularTotal(),
        total_desconto: parseFloat(data.total_desconto) || 0,
      };

      if (isEdit) {
        await orcamentoService.atualizar(id, dadosOrcamento);
        toast.success('Orçamento atualizado com sucesso');
      } else {
        await orcamentoService.criar(dadosOrcamento);
        toast.success('Orçamento criado com sucesso');
      }
      
      navigate('/orcamentos');
    } catch (error) {
      toast.error('Erro ao salvar orçamento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if ((loading || loadingClientes) && isEdit) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Informações Gerais */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informações Gerais
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="cliente_id"
                    control={control}
                    rules={{ required: 'Cliente é obrigatório' }}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={clientes}
                        getOptionLabel={(option) => option.nome}
                        value={clientes.find(c => c.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue ? newValue.id : null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Cliente"
                            error={!!errors.cliente_id}
                            helperText={errors.cliente_id?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          <MenuItem value="pendente">Pendente</MenuItem>
                          <MenuItem value="aprovado">Aprovado</MenuItem>
                          <MenuItem value="rejeitado">Rejeitado</MenuItem>
                          <MenuItem value="expirado">Expirado</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="data_validade"
                    control={control}
                    rules={{ required: 'Data de validade é obrigatória' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Validade"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.data_validade}
                        helperText={errors.data_validade?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Dados do Veículo */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dados do Veículo
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="placa"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Placa" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="odometro"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Odômetro" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="tanque"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Tanque</InputLabel>
                        <Select {...field} label="Tanque">
                          <MenuItem value="vazio">Vazio</MenuItem>
                          <MenuItem value="1/4">1/4</MenuItem>
                          <MenuItem value="1/2">1/2</MenuItem>
                          <MenuItem value="3/4">3/4</MenuItem>
                          <MenuItem value="cheio">Cheio</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="combustivel"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Combustível" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="montadora"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Montadora" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="veiculo"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Veículo" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="modelo"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Modelo" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="ano"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Ano" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="motor"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Motor" />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Descrição dos Serviços */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Descrição dos Serviços
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="descricao_problema"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descrição do Problema"
                        multiline
                        rows={3}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="descricao_servico"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descrição do Serviço Realizado"
                        multiline
                        rows={3}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Itens do Orçamento */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Itens do Orçamento
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Descrição do Item"
                    value={novoItem.descricao}
                    onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Valor Unitário"
                    type="number"
                    value={novoItem.valor}
                    onChange={(e) => setNovoItem({ ...novoItem, valor: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    inputProps={{
                      step: 0.01,
                      min: 0,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={adicionarItem}
                    sx={{ height: '56px' }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
              </Grid>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="center">Quantidade</TableCell>
                      <TableCell align="right">Valor Unitário</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      itens.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">{formatCurrency(item.valor)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.valor * item.quantidade)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removerItem(index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Valores e Condições */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Valores e Condições
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Subtotal
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(calcularTotal())}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="total_desconto"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Total de Desconto"
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        inputProps={{
                          step: 0.01,
                          min: 0,
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Total Final
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(calcularTotalComDesconto())}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="condicao_pagamento"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Condição de Pagamento"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="garantia_servico"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Garantia do Serviço"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="observacoes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Observações"
                        multiline
                        rows={3}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/orcamentos')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}

export default OrcamentoForm;