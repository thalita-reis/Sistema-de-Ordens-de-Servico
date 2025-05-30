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
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit,
  Print,
  ArrowBack,
  Phone,
  Email,
  Home,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatCPF, formatPhone, formatCEP, formatDate } from '../../utils/formatters';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ClienteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    carregarCliente();
  }, [id]);

  const carregarCliente = async () => {
    try {
      setLoading(true);
      const response = await clienteService.buscarPorId(id);
      setCliente(response.data);
    } catch (error) {
      toast.error('Erro ao carregar cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!cliente) {
    return null;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Detalhes do Cliente</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/clientes')}
          >
            Voltar 
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
          >
             IMPRIMIR 
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/clientes/${id}/editar`)}
          >
            Editar 
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações Pessoais
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Nome
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {cliente.nome}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  CPF
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatCPF(cliente.cpf) || 'Não informado'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  RG
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {cliente.rg || 'Não informado'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Data de Nascimento
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {cliente.data_nascimento ? formatDate(cliente.data_nascimento) : 'Não informado'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Tipo
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {cliente.pessoa_juridica ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={cliente.ficha_inativa ? 'Inativo' : 'Ativo'}
                  color={cliente.ficha_inativa ? 'error' : 'success'}
                  size="small"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Contatos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Telefone
                    </Typography>
                    <Typography variant="body1">
                      {formatPhone(cliente.telefone) || 'Não informado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Celular
                    </Typography>
                    <Typography variant="body1">
                      {formatPhone(cliente.celular) || 'Não informado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {cliente.email || 'Não informado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Endereço
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" alignItems="flex-start" gap={1}>
              <Home fontSize="small" color="action" sx={{ mt: 0.5 }} />
              <Box>
                {cliente.rua ? (
                  <>
                    <Typography variant="body1">
                      {cliente.rua}{cliente.numero ? `, ${cliente.numero}` : ''}
                    </Typography>
                    <Typography variant="body1">
                      {cliente.bairro || ''} {cliente.bairro && (cliente.cidade || cliente.uf) ? '-' : ''} {cliente.cidade || ''} {cliente.uf ? `/ ${cliente.uf}` : ''}
                    </Typography>
                    {cliente.cep && (
                      <Typography variant="body1">
                        CEP: {formatCEP(cliente.cep)}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    Endereço não informado
                  </Typography>
                )}
              </Box>
            </Box>

            {cliente.observacoes_gerais && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Observações
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {cliente.observacoes_gerais}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumo
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="textSecondary">
                Data de Cadastro:
              </Typography>
              <Typography variant="body2">
                {formatDate(cliente.data_inclusao)}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="textSecondary">
                Total de Ordens:
              </Typography>
              <Typography variant="body2">
                {cliente.ordens_servico?.length || 0}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                Total de Orçamentos:
              </Typography>
              <Typography variant="body2">
                {cliente.orcamentos?.length || 0}
              </Typography>
            </Box>
          </Paper>

          <Paper>
            <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Orçamentos" />
            </Tabs>
            
            <TabPanel value={tab} index={0}>
              {cliente.ordens_servico?.length > 0 ? (
                cliente.ordens_servico.map((ordem) => (
                  <Box
                    key={ordem.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      OS #{ordem.numero}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(ordem.data_abertura)}
                    </Typography>
                    <Chip
                      label={ordem.status}
                      size="small"
                      sx={{ mt: 1 }}
                      color={
                        ordem.status === 'finalizada' ? 'success' :
                        ordem.status === 'cancelada' ? 'error' : 'warning'
                      }
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  Nenhuma ordem de serviço encontrada
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={tab} index={1}>
              {cliente.orcamentos?.length > 0 ? (
                cliente.orcamentos.map((orcamento) => (
                  <Box
                    key={orcamento.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => navigate(`/orcamentos/${orcamento.id}`)}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      Orçamento #{orcamento.numero}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(orcamento.data_criacao)}
                    </Typography>
                    <Chip
                      label={orcamento.status}
                      size="small"
                      sx={{ mt: 1 }}
                      color={
                        orcamento.status === 'aprovado' ? 'success' :
                        orcamento.status === 'rejeitado' ? 'error' : 'warning'
                      }
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  Nenhum orçamento encontrado
                </Typography>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ClienteView;