import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI-Fehler:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Es ist ein unerwarteter Fehler aufgetreten.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" onClick={() => window.location.assign('/')}>
            Zur Startseite
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
