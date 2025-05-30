import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import dadosEmpresaService from '../../services/dadosEmpresaService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatCNPJ, formatPhone, formatCEP } from '../../utils/formatters';

function Administracao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm({
    defaultValues: {
      razao_social: '',
      nome_oficina: '',
      cnpj: '',
      inscricao_estadual: '',
      email: '',
      endereco: '',
      numero: '',
      bairro: '',
      celular: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await dadosEmpresaService.buscar();
      const dados = response.data;
      
      Object.keys(dados).forEach((key) => {
        if (dados[key] !== null && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          setValue(key, dados[key]);
        }
      });
    } catch (error) {
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      const dadosLimpos = {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ''),
        celular: data.celular.replace(/\D/g, ''),
        cep: data.cep.replace(/\D/g, ''),
      };

      await dadosEmpresaService.atualizar(dadosLimpos);
      toast.success('Dados atualizados com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar dados');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administração - Dados da Oficina
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="razao_social"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Razão Social" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="nome_oficina"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Nome da Oficina" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="cnpj"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CNPJ"
                    onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="inscricao_estadual"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Inscrição Estadual" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="E-mail" type="email" />
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
                name="endereco"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Endereço" />
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
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Estado" inputProps={{ maxLength: 2 }} />
                )}
              />
            </Grid>

            <Grid item xs={12} md={2}>
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
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default Administracao;