import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
          <div style={{ maxWidth: '480px', backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#ef4444', borderRadius: '12px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Centro de Control ADIF</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>Se ha producido un error al cargar los datos. Pulsa en reiniciar para recargar la aplicación limpiamente.</p>
            <button 
              onClick={() => {
                try {
                  localStorage.removeItem('adif_admin_session_v2');
                } catch {}
                window.location.reload();
              }}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
