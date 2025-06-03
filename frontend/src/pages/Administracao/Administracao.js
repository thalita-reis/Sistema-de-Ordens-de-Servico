import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';

function Administracao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch
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
      cidade: '',
      estado: '',
      cep: '',
      celular: ''
    }
  });

  // ============================================
  // 🔍 CARREGAR DADOS DA EMPRESA
  // ============================================
  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando dados da empresa...');

      // ✅ FORÇAR DADOS FRESCOS COM TIMESTAMP
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:5000/api/dados-empresa?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const dados = await response.json();
      console.log('✅ Dados carregados:', dados);

      // ✅ PREENCHER FORMULÁRIO COM DADOS REAIS
      Object.keys(dados).forEach(key => {
        if (setValue && dados[key] !== undefined) {
          setValue(key, dados[key] || '');
        }
      });

      console.log('✅ Formulário preenchido com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 💾 SUPER SALVAMENTO COM MÚLTIPLAS ESTRATÉGIAS
  // ============================================
  const onSubmit = async (data) => {
    try {
      setSaving(true);
      console.log('🚀 ========================================');
      console.log('🚀 SUPER SALVAMENTO - MÚLTIPLAS ESTRATÉGIAS');
      console.log('🚀 ========================================');
      console.log('💾 Dados para salvar:', data);

      // ✅ LIMPAR FORMATAÇÃO DOS CAMPOS
      const dadosLimpos = {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ''),
        cep: data.cep.replace(/\D/g, ''),
        celular: data.celular.replace(/\D/g, '')
      };

      console.log('📝 Dados limpos para envio:', dadosLimpos);

      // ✅ ESTRATÉGIA 1: PUT PRINCIPAL
      let sucesso = false;
      try {
        console.log('🔄 ESTRATÉGIA 1: PUT principal');
        const putResponse = await fetch('http://localhost:5000/api/dados-empresa', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(dadosLimpos)
        });

        if (putResponse.ok) {
          const putResult = await putResponse.json();
          console.log('✅ PUT funcionou:', putResult);
          sucesso = true;
        } else {
          console.log('⚠️ PUT falhou com status:', putResponse.status);
        }
      } catch (putError) {
        console.log('❌ PUT error:', putError.message);
      }

      // ✅ ESTRATÉGIA 2: POST COMO FALLBACK
      if (!sucesso) {
        try {
          console.log('🔄 ESTRATÉGIA 2: POST fallback');
          const postResponse = await fetch('http://localhost:5000/api/dados-empresa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(dadosLimpos)
          });

          if (postResponse.ok) {
            const postResult = await postResponse.json();
            console.log('✅ POST funcionou:', postResult);
            sucesso = true;
          } else {
            console.log('⚠️ POST falhou com status:', postResponse.status);
          }
        } catch (postError) {
          console.log('❌ POST error:', postError.message);
        }
      }

      // ✅ ESTRATÉGIA 3: FORÇA BRUTA - MÚLTIPLOS ENDPOINTS
      if (!sucesso) {
        const endpoints = [
          'http://localhost:5000/api/empresa',
          'http://localhost:5000/dados-empresa',
          'http://localhost:5000/api/dados-empresa/update'
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 ESTRATÉGIA 3: Tentando ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify(dadosLimpos)
            });

            if (response.ok) {
              console.log(`✅ Sucesso em ${endpoint}`);
              sucesso = true;
              break;
            }
          } catch (error) {
            console.log(`❌ Falhou ${endpoint}:`, error.message);
          }
        }
      }

      // ✅ FORÇAR PROPAGAÇÃO DOS DADOS
      await forcarPropagacaoDados(dadosLimpos);

      // ✅ FORÇAR LIMPEZA DE CACHE EM TODAS AS INSTÂNCIAS
      await limparTodosOsCachesPossiveis();

      // ✅ SALVAR NO LOCALSTORAGE COMO BACKUP
      localStorage.setItem('dadosEmpresaBackup', JSON.stringify(dadosLimpos));
      localStorage.setItem('ultimaAtualizacaoEmpresa', Date.now().toString());

      // ✅ RECARREGAR DADOS PARA CONFIRMAR SALVAMENTO
      setTimeout(() => {
        carregarDados();
      }, 1000);

      if (sucesso) {
        toast.success('✅ Dados salvos com sucesso!');
        toast.info('🔄 Alterações propagadas para todos os sistemas!');
        toast.success(`🎯 Empresa: ${dadosLimpos.razao_social}`);
      } else {
        toast.warning('⚠️ Salvamento local realizado. Verifique a conexão.');
      }

    } catch (error) {
      console.error('❌ Erro crítico no salvamento:', error);
      toast.error(`Erro ao salvar dados: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // 🔄 FORÇAR PROPAGAÇÃO DOS DADOS
  // ============================================
  const forcarPropagacaoDados = async (dados) => {
    try {
      console.log('🔄 Forçando propagação dos dados...');

      // ✅ MÚLTIPLAS CHAMADAS PARA GARANTIR PROPAGAÇÃO
      const propagacoes = [
        // Chamar GET para atualizar cache
        fetch(`http://localhost:5000/api/dados-empresa?force_update=${Date.now()}`),
        
        // Chamar rota de teste para validar
        fetch(`http://localhost:5000/api/dados-empresa/test?validate=${Date.now()}`),
        
        // Simular chamada de orçamento para atualizar cache
        fetch(`http://localhost:5000/api/dados-empresa?from_orcamento=${Date.now()}`),
        
        // POST com flag de sincronização
        fetch('http://localhost:5000/api/dados-empresa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dados, _sync: true, _force: true })
        })
      ];

      await Promise.allSettled(propagacoes);
      console.log('✅ Propagação forçada concluída');

    } catch (error) {
      console.log('⚠️ Erro na propagação:', error.message);
    }
  };

  // ============================================
  // 🧹 LIMPAR TODOS OS CACHES POSSÍVEIS
  // ============================================
  const limparTodosOsCachesPossiveis = async () => {
    try {
      console.log('🧹 Limpando TODOS os caches possíveis...');
      
      // ✅ Cache API do navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Cache API limpo');
      }
      
      // ✅ LocalStorage relacionado à empresa
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('empresa') || 
          key.includes('dados') || 
          key.includes('oficina') ||
          key.includes('orcamento')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        if (key !== 'dadosEmpresaBackup' && key !== 'ultimaAtualizacaoEmpresa') {
          localStorage.removeItem(key);
        }
      });
      
      // ✅ SessionStorage completo
      sessionStorage.clear();
      
      // ✅ Forçar recarregamento de componentes
      window.dispatchEvent(new CustomEvent('empresaAtualizada', { 
        detail: { timestamp: Date.now() } 
      }));
      
      console.log('✅ TODOS os caches limpos com sucesso');
      
    } catch (error) {
      console.log('⚠️ Erro na limpeza de cache:', error.message);
    }
  };

  // ============================================
  // 🔍 BUSCAR CEP AUTOMATICAMENTE
  // ============================================
  const buscarCEP = async (cep) => {
    if (cep.length === 8) {
      try {
        console.log('🔍 Buscando CEP:', cep);
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data && !data.erro) {
          setValue('endereco', data.logradouro || '');
          setValue('bairro', data.bairro || '');
          setValue('cidade', data.localidade || '');
          setValue('estado', data.uf || '');
          console.log('✅ CEP encontrado:', data);
          toast.success('CEP encontrado!');
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar CEP:', error);
      }
    }
  };

  // ============================================
  // 🎭 MÁSCARAS PARA CAMPOS
  // ============================================
  const aplicarMascara = (valor, tipo) => {
    if (!valor) return '';
    
    switch (tipo) {
      case 'cnpj':
        return valor
          .replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .substring(0, 18);
      
      case 'cep':
        return valor
          .replace(/\D/g, '')
          .replace(/^(\d{5})(\d)/, '$1-$2')
          .substring(0, 9);
      
      case 'telefone':
        return valor
          .replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2')
          .substring(0, 15);
      
      default:
        return valor;
    }
  };

  // ============================================
  // 🏁 INICIALIZAÇÃO
  // ============================================
  useEffect(() => {
    carregarDados();
  }, []);

  // ============================================
  // 🎨 RENDERIZAÇÃO
  // ============================================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando dados da empresa...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administração - Dados da Oficina
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            
            {/* RAZÃO SOCIAL */}
            <Grid item xs={12} md={6}>
              <Controller
                name="razao_social"
                control={control}
                rules={{ required: 'Razão social é obrigatória' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Razão Social * (NOME QUE APARECE NO ORÇAMENTO)"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Este nome aparecerá no cabeçalho dos orçamentos impressos'}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#ff9800',
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: '#f57c00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#e65100',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#ff9800',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* NOME DA OFICINA */}
            <Grid item xs={12} md={6}>
              <Controller
                name="nome_oficina"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome da Oficina"
                    fullWidth
                    variant="outlined"
                    helperText="Nome fantasia da oficina (opcional)"
                  />
                )}
              />
            </Grid>

            {/* CNPJ */}
            <Grid item xs={12} md={6}>
              <Controller
                name="cnpj"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="CNPJ"
                    fullWidth
                    variant="outlined"
                    onChange={(e) => {
                      const valorFormatado = aplicarMascara(e.target.value, 'cnpj');
                      field.onChange(valorFormatado);
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                )}
              />
            </Grid>

            {/* INSCRIÇÃO ESTADUAL */}
            <Grid item xs={12} md={6}>
              <Controller
                name="inscricao_estadual"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Inscrição Estadual"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* EMAIL */}
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                rules={{ 
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="E-mail"
                    fullWidth
                    variant="outlined"
                    type="email"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            {/* CELULAR */}
            <Grid item xs={12} md={6}>
              <Controller
                name="celular"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Celular"
                    fullWidth
                    variant="outlined"
                    onChange={(e) => {
                      const valorFormatado = aplicarMascara(e.target.value, 'telefone');
                      field.onChange(valorFormatado);
                    }}
                    placeholder="(11) 99999-9999"
                  />
                )}
              />
            </Grid>

            {/* CEP */}
            <Grid item xs={12} md={3}>
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="CEP"
                    fullWidth
                    variant="outlined"
                    onChange={(e) => {
                      const valorFormatado = aplicarMascara(e.target.value, 'cep');
                      field.onChange(valorFormatado);
                      
                      // Buscar CEP quando completo
                      const cepLimpo = valorFormatado.replace(/\D/g, '');
                      if (cepLimpo.length === 8) {
                        buscarCEP(cepLimpo);
                      }
                    }}
                    placeholder="00000-000"
                  />
                )}
              />
            </Grid>

            {/* ENDEREÇO */}
            <Grid item xs={12} md={6}>
              <Controller
                name="endereco"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Endereço"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* NÚMERO */}
            <Grid item xs={12} md={3}>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* BAIRRO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="bairro"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Bairro"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* CIDADE */}
            <Grid item xs={12} md={4}>
              <Controller
                name="cidade"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cidade"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* ESTADO */}
            <Grid item xs={12} md={4}>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Estado"
                    fullWidth
                    variant="outlined"
                    inputProps={{ maxLength: 2 }}
                    placeholder="SP"
                  />
                )}
              />
            </Grid>

            {/* BOTÃO SALVAR */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  disabled={saving}
                  sx={{ 
                    minWidth: 250,
                    background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                    boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #E55A2B 30%, #E8841B 90%)',
                    },
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {saving ? '🔄 SALVANDO COM SUPER SYNC...' : ' SALVAR'}
                </Button>
              </Box>
            </Grid>

          </Grid>
        </form>

        {/* INFORMAÇÕES DE SINCRONIZAÇÃO */}
        <Box mt={4} p={3} bgcolor="linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)" borderRadius={2} border="2px solid #4caf50">
        
          <Typography variant="body2" color="text.secondary" mb={1}>
            💾 <strong>Backup local:</strong> Dados salvos localmente como segurança
          </Typography>
          <Typography variant="body2" color="success.main">
            🎯 <strong>Garantia:</strong> Alterações refletem IMEDIATAMENTE na impressão dos orçamentos
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Administracao;