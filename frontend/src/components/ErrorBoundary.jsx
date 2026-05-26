import React from 'react';
import FloatingCard from './FloatingCard';
import GlowButton from './GlowButton';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper" style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <FloatingCard style={{ maxWidth: '500px', textAlign: 'center' }}>
            <AlertTriangle size={64} color="#EF4444" style={{ margin: '0 auto 24px auto' }} />
            <h2 style={{ marginBottom: '16px' }}>Neural Link Interrupted</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
              A runtime error occurred in the analysis engine. This has been logged for review.
            </p>
            <GlowButton onClick={() => window.location.reload()}>
              Reinitialize System
            </GlowButton>
          </FloatingCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
