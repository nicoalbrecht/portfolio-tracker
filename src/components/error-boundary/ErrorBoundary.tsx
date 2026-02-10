"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** If true, shows a minimal inline error instead of full card */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.inline) {
        return (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Something went wrong</span>
            <Button variant="ghost" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        );
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}
