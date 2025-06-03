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
  // ✅ CORREÇÃO 1: Estado inicial como array vazio
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

  // ✅ CORREÇÃO 2: Função carregarClientes com tratamento robusto
  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      console.log('🔍 OrcamentoForm.carregarClientes - Iniciando...');
      
      const response = await clienteService.listar({ limit: 1000 });
      
      console.log('📦 Resposta clientes:', response);
      console.log('📊 response.data:', response.data);

      // ✅ CORREÇÃO 3: Tratamento robusto da resposta de clientes
      let clientesData = [];

      if (response && response.data) {
        // Caso 1: response.data.clientes (formato esperado)
        if (response.data.clientes && Array.isArray(response.data.clientes)) {
          clientesData = response.data.clientes;
          console.log('✅ Clientes formato 1: response.data.clientes');
        }
        // Caso 2: response.data é array direto
        else if (Array.isArray(response.data)) {
          clientesData = response.data;
          console.log('✅ Clientes formato 2: response.data como array');
        }
        // Caso 3: response.data.data (formato alternativo)
        else if (response.data.data && Array.isArray(response.data.data)) {
          clientesData = response.data.data;
          console.log('✅ Clientes formato 3: response.data.data');
        }
        else {
          console.log('⚠️ Estrutura de clientes não reconhecida:', response.data);
          clientesData = [];
        }
      } else {
        console.log('❌ response de clientes não existe');
        clientesData = [];
      }

      console.log('✅ Clientes carregados:', clientesData.length);
      setClientes(Array.isArray(clientesData) ? clientesData : []);

    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
      setClientes([]); // ✅ Estado seguro em caso de erro
    } finally {
      setLoadingClientes(false);
    }
  };

  // ✅ CORREÇÃO 4: Função carregarOrcamento com tratamento robusto
  const carregarOrcamento = async () => {
    try {
      setLoading(true);
      console.log('🔍 OrcamentoForm.carregarOrcamento - ID:', id);
      
      const response = await orcamentoService.buscarPorId(id);
      
      console.log('📦 Resposta orçamento:', response);

      // ✅ CORREÇÃO 5: Extrair dados do orçamento de forma segura
      let orcamento = null;

      if (response && response.data) {
        // Caso 1: response.data é o orçamento direto
        if (response.data.id || response.data.numero) {
          orcamento = response.data;
          console.log('✅ Orçamento formato 1: response.data direto');
        }
        // Caso 2: response.data.data contém o orçamento
        else if (response.data.data && (response.data.data.id || response.data.data.numero)) {
          orcamento = response.data.data;
          console.log('✅ Orçamento formato 2: response.data.data');
        }
        else {
          console.log('❌ Estrutura de orçamento não reconhecida:', response.data);
          throw new Error('Orçamento não encontrado ou estrutura inválida');
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }

      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      console.log('✅ Orçamento carregado:', orcamento.numero);
      
      // Carregar todos os campos
      Object.keys(orcamento).forEach(key => {
        if (key === 'data_validade') {
          setValue(key, orcamento[key].split('T')[0]);
        } else if (key !== 'itens' && key !== 'createdAt' && key !== 'updatedAt') {
          setValue(key, orcamento[key] || '');
        }
      });
      
      // ✅ CORREÇÃO 6: Tratar itens de forma segura
      if (orcamento.itens && Array.isArray(orcamento.itens) && orcamento.itens.length > 0) {
        setItens(orcamento.itens);
        console.log('✅ Itens carregados:', orcamento.itens.length);
      } else {
        setItens([]);
        console.log('ℹ️ Nenhum item encontrado no orçamento');
      }

    } catch (error) {
      console.error('❌ Erro ao carregar orçamento:', error);
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
      console.log('💾 Salvando orçamento...', { isEdit, data });
      
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
      console.error('❌ Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREÇÃO 7: Verificação de loading mais robusta
  if ((loading || loadingClientes) && isEdit) {
    return <LoadingSpinner />;
  }

  console.log('🎯 Renderização OrcamentoForm:', {
    loading,
    loadingClientes,
    clientes: clientes?.length || 0,
    itens: itens?.length || 0,
    isEdit
  });

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
                        // ✅ CORREÇÃO 8: Garantir que options é sempre array
                        options={Array.isArray(clientes) ? clientes : []}
                        getOptionLabel={(option) => option.nome || 'Nome não disponível'}
                        value={clientes.find(c => c.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue ? newValue.id : null);
                        }}
                        loading={loadingClientes}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Cliente"
                            error={!!errors.cliente_id}
                            helperText={errors.cliente_id?.message || (loadingClientes ? 'Carregando clientes...' : '')}
                          />
                        )}
                        noOptionsText={loadingClientes ? "Carregando..." : "Nenhum cliente encontrado"}
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
                    {/* ✅ CORREÇÃO 9: Verificação dupla do array de itens */}
                    {!Array.isArray(itens) || itens.length === 0 ? (
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