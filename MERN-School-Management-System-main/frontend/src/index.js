import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import store from './redux/store';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import Scrollbar from 'smooth-scrollbar'; // 👈 import scrollbar

// 👉 Initialize scrollbar globally
Scrollbar.init(document.body, {
  damping: 0.07, // smoothness
  alwaysShowTracks: true,
  continuousScrolling: true,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
