import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import clienteService from '../../services/clienteService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  formatCPF,
  formatPhone,
  formatCEP,
} from '../../utils/formatters';
import { validateCPF, validateEmail } from '../../utils/validators';

function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      nome: '',
      cpf: '',
      telefone: '',
      celular: '',
      fax: '',
      email: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      pessoa_juridica: false,
      observacoes_gerais: '',
    },
  });

  const cep = watch('cep');

  useEffect(() => {
    if (isEdit) {
      carregarCliente();
    }
  }, [id]);

  useEffect(() => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      buscarCEP(cep);
    }
  }, [cep]);

  const carregarCliente = async () => {
    try {
      setLoading(true);
      const response = await clienteService.buscarPorId(id);
      const cliente = response.data;
      
      Object.keys(cliente).forEach((key) => {
        if (cliente[key] !== null) {
          setValue(key, cliente[key]);
        }
      });
    } catch (error) {
      toast.error('Erro ao carregar cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const buscarCEP = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      const dados = await clienteService.buscarCEP(cepLimpo);
      
      if (!dados.erro) {
        setValue('rua', dados.logradouro);
        setValue('bairro', dados.bairro);
        setValue('cidade', dados.localidade);
        setValue('uf', dados.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Limpar máscaras
      const dadosLimpos = {
        ...data,
        cpf: data.cpf.replace(/\D/g, ''),
        telefone: data.telefone.replace(/\D/g, ''),
        celular: data.celular.replace(/\D/g, ''),
        cep: data.cep.replace(/\D/g, ''),
      };

      if (isEdit) {
        await clienteService.atualizar(id, dadosLimpos);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await clienteService.criar(dadosLimpos);
        toast.success('Cliente cadastrado com sucesso');
      }
      
      navigate('/clientes');
    } catch (error) {
      toast.error('Erro ao salvar cliente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="nome"
                control={control}
                rules={{ required: 'Nome é obrigatório' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="NOME COMPLETO"
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="cpf"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return true;
                    return validateCPF(value) || 'CPF inválido';
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CPF"
                    error={!!errors.cpf}
                    helperText={errors.cpf?.message}
                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="pessoa_juridica"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Pessoa Jurídica"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefone"
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="celular"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Celular"
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="email"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return true;
                    return validateEmail(value) || 'Email inválido';
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Endereço
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CEP"
                    onChange={(e) => field.onChange(formatCEP(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="rua"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Rua" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Número" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="complemento"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Complemento" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="bairro"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Bairro" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="cidade"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Cidade" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Controller
                name="uf"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="UF" inputProps={{ maxLength: 2 }} />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="observacoes_gerais"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Observações"
                    multiline
                    rows={4}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/clientes')}
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
      </Paper>
    </Box>
  );
}

export default ClienteForm;