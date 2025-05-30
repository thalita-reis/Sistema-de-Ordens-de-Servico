import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  People,
  Description,
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import clienteService from '../../services/clienteService';
import orcamentoService from '../../services/orcamentoService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    orcamentosPendentes: 0,
    orcamentosAprovados: 0,
    faturamentoMensal: 0,
  });
  const [chartData, setChartData] = useState({
    orcamentosStatus: [],
    faturamentoMensal: [],
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [clientesRes, orcamentosRes] = await Promise.all([
        clienteService.listar({ limit: 1 }),
        orcamentoService.listar({ limit: 1000 }),
      ]);

      const orcamentos = orcamentosRes.data.orcamentos;
      const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
      const orcamentosAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
      const orcamentosRejeitados = orcamentos.filter(o => o.status === 'rejeitado').length;
      const orcamentosExpirados = orcamentos.filter(o => o.status === 'expirado').length;

      // Calcular faturamento com base em orçamentos aprovados
      const faturamentoMensal = orcamentos
        .filter(o => o.status === 'aprovado')
        .reduce((sum, o) => {
          const valorTotal = parseFloat(o.valor_total || 0);
          const desconto = parseFloat(o.total_desconto || 0);
          return sum + (valorTotal - desconto);
        }, 0);

      setStats({
        totalClientes: clientesRes.data.total,
        orcamentosPendentes,
        orcamentosAprovados,
        faturamentoMensal,
      });

      setChartData({
        orcamentosStatus: [
          { name: 'Pendentes', value: orcamentosPendentes },
          { name: 'Aprovados', value: orcamentosAprovados },
          { name: 'Rejeitados', value: orcamentosRejeitados },
          { name: 'Expirados', value: orcamentosExpirados },
        ],
        faturamentoMensal: calcularFaturamentoMensal(orcamentos),
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Definir valores padrão em caso de erro
      setStats({
        totalClientes: 0,
        orcamentosPendentes: 0,
        orcamentosAprovados: 0,
        faturamentoMensal: 0,
      });
      setChartData({
        orcamentosStatus: [],
        faturamentoMensal: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularFaturamentoMensal = (orcamentos) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const faturamentoPorMes = {};
    const anoAtual = new Date().getFullYear();

    // Inicializar todos os meses com 0
    meses.forEach((mes, index) => {
      faturamentoPorMes[`${anoAtual}-${index}`] = { mes, valor: 0 };
    });

    // Somar valores dos orçamentos aprovados por mês
    orcamentos
      .filter(o => o.status === 'aprovado')
      .forEach(orcamento => {
        const data = new Date(orcamento.data_criacao);
        if (data.getFullYear() === anoAtual) {
          const key = `${anoAtual}-${data.getMonth()}`;
          const valorTotal = parseFloat(orcamento.valor_total || 0);
          const desconto = parseFloat(orcamento.total_desconto || 0);
          faturamentoPorMes[key].valor += (valorTotal - desconto);
        }
      });

    return Object.values(faturamentoPorMes);
  };

  if (loading) return <LoadingSpinner />;

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box sx={{ 
            backgroundColor: color, 
            borderRadius: '50%', 
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total de Clientes" 
            value={stats.totalClientes} 
            icon={<People sx={{ color: 'white' }} />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Orçamentos Pendentes" 
            value={stats.orcamentosPendentes} 
            icon={<Description sx={{ color: 'white' }} />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Orçamentos Aprovados" 
            value={stats.orcamentosAprovados} 
            icon={<TrendingUp sx={{ color: 'white' }} />} 
            color="#9c27b0" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Faturamento Total" 
            value={`R$ ${stats.faturamentoMensal.toFixed(2)}`} 
            icon={<AttachMoney sx={{ color: 'white' }} />} 
            color="#2e7d32" 
          />
        </Grid>

        {/* Orçamentos PieChart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Status dos Orçamentos</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.orcamentosStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.orcamentosStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Estatísticas Adicionais */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Resumo de Orçamentos</Typography>
            <Box sx={{ mt: 3 }}>
              {chartData.orcamentosStatus.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '4px',
                          mr: 2
                        }}
                      />
                      <Typography variant="body1">{item.name}</Typography>
                    </Box>
                    <Typography variant="h6">{item.value}</Typography>
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight="bold">Total de Orçamentos</Typography>
                <Typography variant="h6" color="primary">
                  {chartData.orcamentosStatus.reduce((sum, item) => sum + item.value, 0)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Faturamento Mensal BarChart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Faturamento Mensal (Orçamentos Aprovados)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData.faturamentoMensal}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="valor" fill="#8884d8" name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;