import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let details = '';

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Firebase Error: ${parsed.error}`;
            details = `Operation: ${parsed.operationType} on ${parsed.path}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 p-8 rounded-lg max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-[#E50914] mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-2">{errorMessage}</p>
            {details && <p className="text-xs text-gray-500 mb-6 font-mono">{details}</p>}
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full bg-[#E50914] text-white py-3 rounded font-bold hover:bg-[#C11119] transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
