import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Short label shown in the fallback so it's obvious which part of the
   * app broke (e.g. "Membership Applications") instead of a generic
   * "something went wrong" that gives no clue to the admin or to us when
   * they report it. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Without this, a single bad record (a missing field, an unexpected type)
 * anywhere in a render tree throws, and because this app previously had NO
 * error boundary anywhere, React unmounts the ENTIRE application — the
 * whole page goes blank, not just the one broken widget. That is almost
 * certainly what "rejected applications show nothing" actually was: one
 * malformed application record crashing the whole admin panel the moment
 * its list tried to render.
 *
 * Wrapping a screen/section in this component means a crash there shows a
 * small, contained "this section had a problem" message with a retry
 * button — everything else on the page (navigation, other tabs, the rest
 * of the admin panel) keeps working.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 m-4 bg-red-50 border-2 border-red-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">
            {this.props.label ? `${this.props.label} couldn't load` : 'Something went wrong displaying this section'}
          </h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            One of the records here has unexpected or missing data, which broke the display. The rest of the site
            is unaffected. Please share this with the developer: <span className="font-mono">{this.state.error.message}</span>
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
