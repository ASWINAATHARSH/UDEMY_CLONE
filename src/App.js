import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register';
import Main from './components/main';
import Cart from './components/cart';
import Takecource from './components/takecource';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Main />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/takecourse" element={<Takecource />} />
      </Routes>
    </Router>
  );
}

export default App;
