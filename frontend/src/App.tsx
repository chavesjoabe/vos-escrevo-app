import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getAppTheme } from './theme/theme';
import { ThemeModeProvider, useThemeMode } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { BookSelectionPage } from './features/bookSelection/BookSelectionPage';
import { PericopeReaderPage } from './features/pericopeReader/PericopeReaderPage';
import { recentBooksStorage } from './api/recentBooksStorage';
import { authApi } from './api/authApi';

interface FallbackBoundaryState {
  hasError: boolean;
}

class AuthFallbackBoundary extends React.Component<
  { children: React.ReactNode },
  FallbackBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): FallbackBoundaryState {
    authApi.clearSession();
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught error in application view, falling back to LoginPage:', error);
  }

  render() {
    if (this.state.hasError) {
      return <LoginPage />;
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { mode } = useThemeMode();
  const { isAuthenticated, user } = useAuth();
  const theme = getAppTheme(mode);
  const [currentView, setCurrentView] = useState<'bookSelection' | 'pericopeReader'>('bookSelection');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedPericopeId, setSelectedPericopeId] = useState<string | undefined>(undefined);

  // Reset view to bookSelection whenever authentication state changes
  useEffect(() => {
    setCurrentView('bookSelection');
    setSelectedBookId('');
    setSelectedPericopeId(undefined);
  }, [isAuthenticated, user?.id]);

  const handleSelectBookAndChapter = (bookId: string, pericopeId?: string) => {
    recentBooksStorage.recordBookAccess(bookId, pericopeId, undefined, user?.id);
    setSelectedBookId(bookId);
    setSelectedPericopeId(pericopeId);
    setCurrentView('pericopeReader');
  };

  const handleBackToBooks = () => {
    setCurrentView('bookSelection');
  };

  if (!isAuthenticated || !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthFallbackBoundary>
        {currentView === 'bookSelection' || !selectedBookId ? (
          <BookSelectionPage onSelectBook={handleSelectBookAndChapter} />
        ) : (
          <PericopeReaderPage
            bookId={selectedBookId}
            initialPericopeId={selectedPericopeId}
            onBackToBooks={handleBackToBooks}
          />
        )}
      </AuthFallbackBoundary>
    </ThemeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeModeProvider>
  );
};

export default App;
