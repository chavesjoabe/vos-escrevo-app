import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@mui/material',
      '@mui/material/styles',
      '@mui/icons-material/LightModeOutlined',
      '@mui/icons-material/DarkModeOutlined',
      '@mui/icons-material/LockOutlined',
      '@mui/icons-material/VisibilityOutlined',
      '@mui/icons-material/VisibilityOffOutlined',
      '@mui/icons-material/ArrowForward',
      '@mui/icons-material/ShieldOutlined',
      '@mui/icons-material/Refresh',
      '@mui/icons-material/MenuBookOutlined',
      '@mui/icons-material/LogoutOutlined',
      '@mui/icons-material/PersonOutline',
      '@mui/icons-material/AutoAwesomeOutlined',
      '@mui/icons-material/Autorenew',
      '@mui/icons-material/ArrowBack',
      '@mui/icons-material/ArrowBackIosNew',
      '@mui/icons-material/SaveOutlined',
      '@mui/icons-material/CheckCircleOutline',
    ],
  },
  server: {
    host: true, // Listen on local IP addresses (0.0.0.0) for local Wi-Fi iPad access
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
