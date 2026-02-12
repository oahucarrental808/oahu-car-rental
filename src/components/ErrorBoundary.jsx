// src/components/ErrorBoundary.jsx
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // You could also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;
      const isDev = import.meta.env.DEV;

      if (fallback) {
        return fallback(this.state.error, this.state.errorInfo);
      }

      return (
        <div
          style={{
            maxWidth: 800,
            margin: "40px auto",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "16px", color: "#d32f2f" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "24px", opacity: 0.8 }}>
            We're sorry, but something unexpected happened. Please try refreshing the page or
            contact support if the problem persists.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              className="button"
              style={{ margin: 0 }}
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="button button-secondary"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              Go Home
            </a>
          </div>

          {(isDev || showDetails) && this.state.error && (
            <details
              style={{
                marginTop: "32px",
                textAlign: "left",
                padding: "16px",
                background: "rgba(0,0,0,0.05)",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}>
                Error Details {isDev ? "(Development Mode)" : ""}
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {"\n\nComponent Stack:"}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
