import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Polyfills for Node.js globals required by simple-peer (Webpack 5 removed node polyfills)
if (typeof window !== 'undefined') {
  if (typeof global === 'undefined') {
    window.global = window;
  }
  if (typeof process === 'undefined') {
    // Minimal process shim sufficient for readable-stream/simple-peer in the browser
    window.process = {
      env: { NODE_ENV: 'development' },
      version: '',
      versions: { node: '16.0.0' },
      nextTick: function(callback, ...args) {
        setTimeout(() => callback(...args), 0);
      }
    };
  }
  if (typeof Buffer === 'undefined') {
    // Minimal Buffer shim sufficient for readable-stream usage in browser
    window.Buffer = {
      isBuffer: () => false,
      from: (data) => new Uint8Array(0),
      alloc: (size) => new Uint8Array(size)
    };
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
