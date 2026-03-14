"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled React errors and displays a recovery UI
 * instead of crashing the entire app.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">&#x1F41B;</div>
            <h2 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-nunito)]">
              A wild bug appeared!
            </h2>
            <p className="text-indigo-200/80 text-sm mb-6">
              Something went wrong on this trail. Don&apos;t worry, your progress is safe.
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-300/70 bg-red-500/10 rounded-xl p-3 mb-6 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-xl font-bold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
