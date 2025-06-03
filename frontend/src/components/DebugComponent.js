import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { 
  BugReport, 
  NetworkCheck, 
  Info, 
  Security,
  ExpandMore,
  Refresh
} from '@mui/icons-material';

// Importar as funções da API
import api, { 
  debugSystem, 
  getApiInfo, 
  testApiConnection, 
  testAuth,
  checkBackendStatus 
} from '../services/api';

const DebugComponent = () => {
  const [debugResults, setDebugResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Executar debug completo
  const handleDebugSystem = async () => {
    setLoading(true);
    setDebugResults(null);
    
    console.log('🚀 Executando debugSystem()...');
    
    try {
      // Capturar logs do console
      const originalLog = console.log;
      const logs = [];
      
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      // Executar debug
      await debugSystem();
      
      // Restaurar console.log
      console.log = originalLog;
      
      // Obter informações adicionais
      const apiInfo = getApiInfo();
      const connectionTest = await testApiConnection();
      const backendStatus = await checkBackendStatus();
      
      setDebugResults({
        logs,
        apiInfo,
        connectionTest,
        backendStatus,
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      console.error('Erro no debug:', error);
      setDebugResults({
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    }
    
    setLoading(false);
  };

  // Testar apenas conexão
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testApiConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Testar autenticação
  const handleTestAuth = async () => {
    setLoading(true);
    try {
      const result = await testAuth('admin@sistema.com', 'password');
      console.log('🔐 Resultado do teste de auth:', result);
    } catch (error) {
      console.error('❌ Erro no teste de auth:', error);
    }
    setLoading(false);
  };

  // Testar dados da empresa diretamente
  const handleTestEmpresa = async () => {
    setLoading(true);
    try {
      console.log('🏢 Testando rota dados-empresa...');
      
      const response = await fetch('http://localhost:5000/api/dados-empresa');
      const data = await response.json();
      
      console.log('✅ Dados da empresa:', data);
      console.log('📝 Razão Social:', data.razao_social);
      console.log('📧 Email:', data.email);
      console.log('📱 Telefone:', data.telefone);
      
      setConnectionStatus({
        success: true,
        data: data,
        message: 'Dados da empresa carregados com sucesso!'
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error);
      setConnectionStatus({
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport color="primary" />
        Debug do Sistema
      </Typography>

      {/* Botões de Ação */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<BugReport />}
          onClick={handleDebugSystem}
          disabled={loading}
          color="primary"
          size="large"
        >
          🔍 Debug Completo
        </Button>

        <Button
          variant="outlined"
          startIcon={<NetworkCheck />}
          onClick={handleTestConnection}
          disabled={loading}
          color="secondary"
        >
          📡 Testar Conexão
        </Button>

        <Button
          variant="outlined"
          startIcon={<Security />}
          onClick={handleTestAuth}
          disabled={loading}
          color="warning"
        >
          🔐 Testar Auth
        </Button>

        <Button
          variant="outlined"
          startIcon={<Info />}
          onClick={() => {
            const info = getApiInfo();
            console.log('ℹ️ API Info:', info);
          }}
          color="info"
        >
          ℹ️ Info da API
        </Button>

        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleTestEmpresa}
          disabled={loading}
          color="success"
        >
          🏢 Testar Empresa
        </Button>
      </Box>

      {/* Status da Conexão */}
      {connectionStatus && (
        <Alert 
          severity={connectionStatus.success ? 'success' : 'error'} 
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">
            {connectionStatus.success ? '✅ Conexão Successful!' : '❌ Falha na Conexão'}
          </Typography>
          <Typography variant="body2">
            {connectionStatus.success 
              ? connectionStatus.message || `Dados: ${JSON.stringify(connectionStatus.data)}` 
              : `Erro: ${connectionStatus.error}`
            }
          </Typography>
        </Alert>
      )}

      {/* Resultados do Debug */}
      {debugResults && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Refresh color="primary" />
            Resultados do Debug
            <Chip label={debugResults.timestamp} size="small" />
          </Typography>

          {debugResults.error ? (
            <Alert severity="error">
              <Typography variant="h6">Erro no Debug:</Typography>
              <Typography variant="body2">{debugResults.error}</Typography>
            </Alert>
          ) : (
            <>
              {/* Informações da API */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">📊 Informações da API</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <pre>{JSON.stringify(debugResults.apiInfo, null, 2)}</pre>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Status da Conexão */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    🔌 Status da Conexão 
                    <Chip 
                      label={debugResults.connectionTest?.success ? 'OK' : 'ERRO'} 
                      color={debugResults.connectionTest?.success ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <pre>{JSON.stringify(debugResults.connectionTest, null, 2)}</pre>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Backend Status */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    🖥️ Status do Backend 
                    <Chip 
                      label={debugResults.backendStatus ? 'ONLINE' : 'OFFLINE'} 
                      color={debugResults.backendStatus ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Backend está {debugResults.backendStatus ? '✅ acessível' : '❌ inacessível'}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Logs Detalhados */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">📋 Logs Detalhados ({debugResults.logs?.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem', 
                    bgcolor: '#1e1e1e', 
                    color: '#fff', 
                    p: 2, 
                    borderRadius: 1,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}>
                    {debugResults.logs?.map((log, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>
                        {log}
                      </div>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </Paper>
      )}

      {/* Instruções */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>📋 Instruções:</Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li><strong>Debug Completo:</strong> Executa todas as verificações e mostra logs detalhados</li>
            <li><strong>Testar Conexão:</strong> Verifica apenas se a API está respondendo</li>
            <li><strong>Testar Auth:</strong> Testa o sistema de autenticação</li>
            <li><strong>Info da API:</strong> Mostra configurações atuais no console</li>
            <li><strong>Testar Empresa:</strong> Testa especificamente a rota de dados da empresa</li>
          </ul>
        </Typography>
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="body2">
            💡 <strong>Dica:</strong> Mantenha o console do navegador aberto (F12) para ver todos os logs em tempo real!
          </Typography>
        </Alert>
        
        {/* URLs de Teste */}
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2">
            🔗 <strong>URLs para testar diretamente:</strong><br/>
            • Backend Health: http://localhost:5000/api/health<br/>
            • Dados Empresa: http://localhost:5000/api/dados-empresa<br/>
            • Frontend: http://localhost:3000
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default DebugComponent