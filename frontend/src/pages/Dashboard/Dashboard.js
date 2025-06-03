import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const COLORS = ['#FF8042', '#00C49F', '#0088FE', '#FFBB28']; // Cores ajustadas

function Dashboard() {
  const navigate = useNavigate(); // ✅ Hook para navegação
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    orcamentosPendentes: 0,
    orcamentosAprovados: 0,
    orcamentosRejeitados: 0,
    faturamentoTotal: 0,
    totalOrcamentos: 0,
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
      console.log('🔍 Dashboard: Carregando dados...');
      
      // ✅ CORREÇÃO 1: Carregar dados com estrutura correta
      const [clientesRes, orcamentosRes] = await Promise.all([
        clienteService.listar({ limit: 1000 }), // Aumentar limite para pegar total real
        orcamentoService.listar({ limit: 1000 })
      ]);

      console.log('📊 Resposta clientes:', clientesRes);
      console.log('📊 Resposta orçamentos:', orcamentosRes);

      // ✅ CORREÇÃO 2: Extrair dados dos clientes de forma robusta
      let totalClientes = 0;
      if (clientesRes && clientesRes.data) {
        if (Array.isArray(clientesRes.data)) {
          totalClientes = clientesRes.data.length;
        } else if (clientesRes.data.data && Array.isArray(clientesRes.data.data)) {
          totalClientes = clientesRes.data.data.length;
        } else if (clientesRes.data.total) {
          totalClientes = clientesRes.data.total;
        }
      }

      // ✅ CORREÇÃO 3: Extrair dados dos orçamentos de forma robusta
      let orcamentos = [];
      if (orcamentosRes && orcamentosRes.data) {
        if (Array.isArray(orcamentosRes.data)) {
          orcamentos = orcamentosRes.data;
        } else if (orcamentosRes.data.data && Array.isArray(orcamentosRes.data.data)) {
          orcamentos = orcamentosRes.data.data;
        } else if (orcamentosRes.data.orcamentos && Array.isArray(orcamentosRes.data.orcamentos)) {
          orcamentos = orcamentosRes.data.orcamentos;
        }
      }

      console.log('✅ Dados extraídos:', {
        totalClientes,
        totalOrcamentos: orcamentos.length,
        primeiroOrcamento: orcamentos[0]
      });

      // ✅ CORREÇÃO 4: Contar orçamentos por status
      const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
      const orcamentosAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
      const orcamentosRejeitados = orcamentos.filter(o => o.status === 'rejeitado').length;
      const orcamentosExpirados = orcamentos.filter(o => o.status === 'expirado').length;

      // ✅ CORREÇÃO 5: Calcular faturamento total (todos os aprovados)
      const faturamentoTotal = orcamentos
        .filter(o => o.status === 'aprovado')
        .reduce((sum, o) => {
          const valorTotal = parseFloat(o.valor_total || o.valor_final || 0);
          const desconto = parseFloat(o.total_desconto || 0);
          return sum + Math.max(0, valorTotal - desconto);
        }, 0);

      console.log('📈 Estatísticas calculadas:', {
        totalClientes,
        orcamentosPendentes,
        orcamentosAprovados,
        orcamentosRejeitados,
        orcamentosExpirados,
        faturamentoTotal,
        totalOrcamentos: orcamentos.length
      });

      // ✅ CORREÇÃO 6: Atualizar estado
      setStats({
        totalClientes,
        orcamentosPendentes,
        orcamentosAprovados,
        orcamentosRejeitados,
        faturamentoTotal,
        totalOrcamentos: orcamentos.length,
      });

      // ✅ CORREÇÃO 7: Dados dos gráficos
      const statusData = [
        { name: 'Pendentes', value: orcamentosPendentes, color: '#FF8042' },
        { name: 'Aprovados', value: orcamentosAprovados, color: '#00C49F' },
        { name: 'Rejeitados', value: orcamentosRejeitados, color: '#0088FE' },
        { name: 'Expirados', value: orcamentosExpirados, color: '#FFBB28' },
      ].filter(item => item.value > 0); // Só mostrar se tiver valores

      setChartData({
        orcamentosStatus: statusData,
        faturamentoMensal: calcularFaturamentoMensal(orcamentos),
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      
      // ✅ CORREÇÃO 8: Valores padrão em caso de erro
      setStats({
        totalClientes: 0,
        orcamentosPendentes: 0,
        orcamentosAprovados: 0,
        orcamentosRejeitados: 0,
        faturamentoTotal: 0,
        totalOrcamentos: 0,
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
    const anoAtual = new Date().getFullYear();
    
    // ✅ CORREÇÃO 9: Inicializar estrutura mensal
    const faturamentoPorMes = meses.map((mes, index) => ({
      mes,
      valor: 0,
      count: 0
    }));

    // ✅ CORREÇÃO 10: Processar orçamentos aprovados
    orcamentos
      .filter(o => o.status === 'aprovado')
      .forEach(orcamento => {
        try {
          const data = new Date(orcamento.data_criacao || orcamento.created_at);
          if (data.getFullYear() === anoAtual && !isNaN(data.getTime())) {
            const mesIndex = data.getMonth();
            const valorTotal = parseFloat(orcamento.valor_total || orcamento.valor_final || 0);
            const desconto = parseFloat(orcamento.total_desconto || 0);
            const valorFinal = Math.max(0, valorTotal - desconto);
            
            if (faturamentoPorMes[mesIndex]) {
              faturamentoPorMes[mesIndex].valor += valorFinal;
              faturamentoPorMes[mesIndex].count += 1;
            }
          }
        } catch (e) {
          console.warn('Erro ao processar data do orçamento:', orcamento, e);
        }
      });

    console.log('📊 Faturamento mensal calculado:', faturamentoPorMes);
    return faturamentoPorMes;
  };

  // ✅ NAVEGAÇÃO: Funções para navegar para diferentes páginas
  const navegarPara = (rota, filtro = null) => {
    if (filtro) {
      // Para orçamentos com filtro de status
      navigate(rota, { state: { statusFilter: filtro } });
    } else {
      // Navegação simples
      navigate(rota);
    }
  };

  // ✅ FORMATAÇÃO: Formatação de moeda melhorada
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) return <LoadingSpinner />;

  // ✅ CARD CLICÁVEL: Componente StatCard com navegação
  const StatCard = ({ title, value, icon, color, onClick, clickable = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': clickable ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        } : {}
      }}
      onClick={clickable ? onClick : undefined}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {clickable && (
              <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                Clique para ver detalhes →
              </Typography>
            )}
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

  // ✅ CORREÇÃO 12: Componente de debug
  console.log('🎯 Renderização Dashboard:', {
    stats,
    chartData,
    loading
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      {/* ✅ Cards de Estatísticas - CLICÁVEIS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total de Clientes" 
            value={stats.totalClientes} 
            icon={<People sx={{ color: 'white' }} />} 
            color="#1976d2"
            clickable={true}
            onClick={() => navegarPara('/clientes')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Orçamentos Pendentes" 
            value={stats.orcamentosPendentes} 
            icon={<Description sx={{ color: 'white' }} />} 
            color="#ed6c02"
            clickable={true}
            onClick={() => navegarPara('/orcamentos', 'pendente')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Orçamentos Aprovados" 
            value={stats.orcamentosAprovados} 
            icon={<TrendingUp sx={{ color: 'white' }} />} 
            color="#2e7d32"
            clickable={true}
            onClick={() => navegarPara('/orcamentos', 'aprovado')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Orçamentos Rejeitados" 
            value={stats.orcamentosRejeitados} 
            icon={<Description sx={{ color: 'white' }} />} 
            color="#d32f2f"
            clickable={true}
            onClick={() => navegarPara('/orcamentos', 'rejeitado')}
          />
        </Grid>

        {/* Segunda linha de cards */}
        <Grid item xs={12} sm={6} md={6}>
          <StatCard 
            title="Faturamento Total" 
            value={formatarMoeda(stats.faturamentoTotal)} 
            icon={<AttachMoney sx={{ color: 'white' }} />} 
            color="#9c27b0"
            clickable={true}
            onClick={() => navegarPara('/orcamentos', 'aprovado')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard 
            title="Total de Orçamentos" 
            value={stats.totalOrcamentos} 
            icon={<Description sx={{ color: 'white' }} />} 
            color="#1976d2"
            clickable={true}
            onClick={() => navegarPara('/orcamentos')}
          />
        </Grid>

        {/* ✅ Gráfico de Pizza - Status dos Orçamentos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Status dos Orçamentos</Typography>
            {chartData.orcamentosStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.orcamentosStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : ''
                    }
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
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  Nenhum orçamento encontrado
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ✅ Resumo de Orçamentos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Resumo de Orçamentos</Typography>
            <Box sx={{ mt: 3 }}>
              {chartData.orcamentosStatus.length > 0 ? (
                <>
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
                </>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography variant="body2" color="textSecondary">
                    Nenhum dados de orçamentos disponível
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ✅ Gráfico de Barras - Faturamento Mensal */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Faturamento Mensal {new Date().getFullYear()} (Orçamentos Aprovados)
            </Typography>
            {chartData.faturamentoMensal.some(item => item.valor > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.faturamentoMensal}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => formatarMoeda(value)} />
                  <Tooltip 
                    formatter={(value, name) => [formatarMoeda(value), 'Faturamento']}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="valor" fill="#8884d8" name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  Nenhum faturamento registrado para {new Date().getFullYear()}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;