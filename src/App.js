import React from 'react';
import OSScheduler from './OSScheduler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <OSScheduler />
    </ErrorBoundary>
  );
}

export default App;


//## **Complete File Structure:**
//```
// src/
// ├── App.js              ← This file (above code)
// ├── OSScheduler.jsx     ← The scheduler component I created
// ├── index.js            ← Entry point (default from create-react-app)
// └── index.css           ← Styles (default from create-react-app)