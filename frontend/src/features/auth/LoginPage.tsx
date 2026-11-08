import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const { mode, toggleThemeMode } = useThemeMode();
  const { login, register } = useAuth();
  const isDark = mode === 'dark';

  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'LOGIN' | 'REGISTER') => {
    setAuthTab(newValue);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (authTab === 'REGISTER') {
      if (!trimmedName) {
        setErrorMessage('Por favor, informe seu nome para criar a conta.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (authTab === 'LOGIN') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedName, trimmedEmail, password);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Não foi possível autenticar. Verifique seus dados e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: sansFontFamily,
      fontSize: '0.95rem',
      color: isDark ? '#F8FAFC' : '#0F172A',
      backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
      borderRadius: 1.5,
      '& fieldset': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
      },
      '&:hover fieldset': {
        borderColor: isDark ? '#64748B' : '#94A3B8',
      },
      '&.Mui-focused fieldset': {
        borderColor: isDark ? '#38BDF8' : '#0284C7',
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: isDark ? '#475569' : '#94A3B8',
      opacity: 1,
    },
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
        pt: {
          xs: 'max(32px, calc(env(safe-area-inset-top, 0px) + 20px))',
          md: 'max(48px, calc(env(safe-area-inset-top, 0px) + 28px))',
        },
        pb: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
        transition: 'background-color 0.25s ease',
      }}
    >
      <Container maxWidth="sm">
        {/* Top Control Bar: Brand Identity & Mode Toggle */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={{ xs: 3, md: 4 }}
        >
          <Typography
            sx={{
              fontFamily: monoFontFamily,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#64748B',
            }}
          >
            Diário de Comentários · BLIVRE
          </Typography>

          <Tooltip title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
            <Button
              variant="outlined"
              size="small"
              onClick={toggleThemeMode}
              startIcon={
                isDark ? (
                  <LightModeOutlinedIcon sx={{ fontSize: 16 }} />
                ) : (
                  <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                fontFamily: monoFontFamily,
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                color: isDark ? '#94A3B8' : '#475569',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                borderRadius: 5,
                px: 1.5,
                py: 0.4,
                '&:hover': {
                  borderColor: isDark ? '#64748B' : '#94A3B8',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                },
              }}
            >
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </Button>
          </Tooltip>
        </Box>

        {/* Hero Masthead matching Home Page */}
        <Box sx={{ mb: { xs: 3.5, md: 4.5 } }}>
          <Box sx={{ mb: 2 }}>
            <Box
              component="img"
              src={isDark ? '/logo-dark.png' : '/logo-light.png'}
              alt="vos-escrevo"
              draggable={false}
              sx={{
                height: { xs: 42, sm: 54 },
                width: 'auto',
                display: 'block',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            />
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', sm: '3rem' },
              fontWeight: 300,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              color: isDark ? '#F8FAFC' : '#0F172A',
              mb: 1.5,
            }}
          >
            Estude a Palavra.
            <br />
            <Box
              component="span"
              sx={{
                color: isDark ? '#5C82A6' : '#2563EB',
                fontWeight: 400,
              }}
            >
              Escrito à mão.
            </Box>
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '0.92rem', sm: '1rem' },
              lineHeight: 1.6,
              color: '#64748B',
            }}
          >
            Acesse seu caderno pessoal de estudos bíblicos para sincronizar seus grifos e reflexões manuscritas com segurança.
          </Typography>
        </Box>

        {/* Authentication Studio Card */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 2,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
            mb: 3,
          }}
        >
          {/* Card Header & Mode Tabs */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            flexWrap="wrap"
            gap={1.5}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <LockOutlinedIcon
                sx={{ fontSize: 18, color: isDark ? '#38BDF8' : '#0284C7' }}
              />
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                {authTab === 'LOGIN' ? 'Entrar no Diário' : 'Criar Conta'}
              </Typography>
            </Box>

            <Tabs
              value={authTab}
              onChange={handleTabChange}
              sx={{
                minHeight: 32,
                '& .MuiTabs-indicator': {
                  backgroundColor: isDark ? '#38BDF8' : '#0284C7',
                  height: '2px',
                  borderRadius: '1px',
                },
              }}
            >
              <Tab
                label="Entrar"
                value="LOGIN"
                sx={{
                  textTransform: 'none',
                  fontWeight: authTab === 'LOGIN' ? 600 : 400,
                  color:
                    authTab === 'LOGIN'
                      ? isDark
                        ? '#F8FAFC !important'
                        : '#0F172A !important'
                      : '#64748B',
                  fontSize: '0.82rem',
                  minWidth: 'auto',
                  px: 1.4,
                  py: 0.25,
                }}
              />
              <Tab
                label="Criar Conta"
                value="REGISTER"
                sx={{
                  textTransform: 'none',
                  fontWeight: authTab === 'REGISTER' ? 600 : 400,
                  color:
                    authTab === 'REGISTER'
                      ? isDark
                        ? '#F8FAFC !important'
                        : '#0F172A !important'
                      : '#64748B',
                  fontSize: '0.82rem',
                  minWidth: 'auto',
                  px: 1.4,
                  py: 0.25,
                }}
              />
            </Tabs>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                fontFamily: sansFontFamily,
                fontSize: '0.85rem',
                borderRadius: 1.5,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2.2}>
            {authTab === 'REGISTER' && (
              <Box>
                <Typography
                  sx={{
                    fontFamily: monoFontFamily,
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isDark ? '#94A3B8' : '#64748B',
                    mb: 0.75,
                  }}
                >
                  Nome Completo
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Ex: Joabe Chaves"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                  sx={inputSx}
                />
              </Box>
            )}

            <Box>
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDark ? '#94A3B8' : '#64748B',
                  mb: 0.75,
                }}
              >
                E-mail
              </Typography>
              <TextField
                fullWidth
                size="medium"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
                sx={inputSx}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDark ? '#94A3B8' : '#64748B',
                  mb: 0.75,
                }}
              >
                Senha
              </Typography>
              <TextField
                fullWidth
                size="medium"
                type={showPassword ? 'text' : 'password'}
                placeholder={authTab === 'REGISTER' ? 'Mínimo de 6 caracteres' : 'Digite sua senha'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete={authTab === 'LOGIN' ? 'current-password' : 'new-password'}
                sx={inputSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => setShowPassword((prev) => !prev)}
                        sx={{ color: isDark ? '#64748B' : '#94A3B8' }}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              endIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ArrowForwardIcon sx={{ fontSize: 17 }} />
                )
              }
              sx={{
                mt: 1,
                py: 1.35,
                fontFamily: sansFontFamily,
                fontWeight: 600,
                fontSize: '0.95rem',
                borderRadius: 1.5,
                backgroundColor: isDark ? '#38BDF8' : '#0284C7',
                color: isDark ? '#0B0F17' : '#FFFFFF',
                '&:hover': {
                  backgroundColor: isDark ? '#7DD3FC' : '#0369A1',
                },
              }}
            >
              {submitting
                ? 'Autenticando...'
                : authTab === 'LOGIN'
                ? 'Entrar no Diário'
                : 'Criar Meu Diário'}
            </Button>
          </Box>
        </Box>

        {/* Privacy & Per-User Isolation Footnote */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.25}
          px={2}
          py={1.5}
          sx={{
            borderRadius: 1.5,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#EDF2F7'}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(241, 245, 249, 0.6)',
          }}
        >
          <ShieldOutlinedIcon
            sx={{ fontSize: 18, color: isDark ? '#38BDF8' : '#0284C7', flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontFamily: sansFontFamily,
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: '#64748B',
            }}
          >
            Suas marcações, sublinhados e anotações manuscritas são estritamente privados. Nenhum outro usuário tem permissão para visualizar seus traços ou comentários.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
