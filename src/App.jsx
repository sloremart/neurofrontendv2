// App.jsx
import React from 'react';
import { BrowserRouter as Router,} from 'react-router-dom';
import {AppRouter} from './router/AppRouter.tsx'
import { Provider } from 'react-redux';
import store from '../src/store/store.ts';
import '../src/style.css';

import { ToastContainer } from 'react-toastify';
const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div>
     

      
          <AppRouter />
          <ToastContainer />
        </div>
      </Router>
    </Provider>
  );
};

export default App;
