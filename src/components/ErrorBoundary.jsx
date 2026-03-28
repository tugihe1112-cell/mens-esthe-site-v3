import React from 'react';
import PropTypes from 'prop-types';

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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
          <div className="bg-slate-900 p-8 rounded-3xl border border-red-900/50 shadow-2xl max-w-md w-full">
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-6">予期せぬエラーが発生しました。</p>
            <button onClick={() => window.location.reload()} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm">再読み込み</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = { children: PropTypes.node.isRequired };
export default ErrorBoundary;
