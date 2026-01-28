import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './css/App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
