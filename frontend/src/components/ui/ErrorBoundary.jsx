import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary – catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Props:
 *   fallback – React node to display when an error occurs (optional)
 *   children – component tree to wrap
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('ErrorBoundary caught an error:', error);
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;
    if (hasError) {
      return fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Something went wrong.</h2>
          {error && <pre className="text-sm text-gray-600 mt-4">{error.toString()}</pre>}
        </div>
      );
    }
    return children;
  }
}

ErrorBoundary.propTypes = {
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
