import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './role/RoleSelection';
import UserForm from './role/UserForm';
import logo from './logo.svg';
import './App.css';  // Make sure this file contains styles for these classes
import UserLogin from "./role/UserLogin"; // your UserLogin.js file
import UserChat from './role/UserChat';
import AdminChat from "./role/AdminChat"
function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo-top" alt="logo" />
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/form/:role" element={<UserForm />} />
            <Route path="/login/:role" element={<UserLogin />} />
            <Route path="/user/chat" element={<UserChat />} />
           <Route path="/admin/chat" element={<AdminChat />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
