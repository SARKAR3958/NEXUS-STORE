import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c12] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4 text-red-400">
            ⚠️
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-xs text-gray-400 mb-6 max-w-md">
            {this.state.error?.message || "An unexpected error occurred while loading the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

