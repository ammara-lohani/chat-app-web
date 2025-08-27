import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function UserLogin() {
  const navigate = useNavigate();
  const { role } = useParams();
  const currentRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'User';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: currentRole.toUpperCase() // Send "ADMIN" or "USER" to match enum
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const endpoint = `${process.env.REACT_APP_API_BASE_URL}/login`;
    console.log('Calling endpoint:', endpoint);
    console.log('Login request data:', formData);

    axios.post(endpoint, formData)
      .then(res => {
        // Align with backend LoginResponse structure
        const token = res.data.token;
        const user = res.data.user;

        if (!token) {
          alert("Login failed: No token received.");
          return;
        }

        // Backend role validation handles this, but keep frontend check for UX
        // Backend sends user.role as enum string, compare consistently
        if (user.role !== formData.role) {
          alert(`Account doesn't exist with this email `);
          return;
        }

        console.log("Generated JWT Token:", token);
        console.log("User role:", user.role);

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        alert('Login successful!');
        navigate(`/${currentRole.toLowerCase()}/chat`);
      })
      .catch(err => {
        if (err.response) {
          console.error('Backend returned status:', err.response.status);
          console.error('Response data:', err.response.data);
          
          // Handle backend error responses (plain strings)
          let errorMessage = '';
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else {
            errorMessage = 'Login failed';
          }
          
          // Handle specific HTTP status codes
          if (err.response.status === 401) {
            alert('Login failed: ' + errorMessage);
          } else if (err.response.status === 403) {
            alert('Access denied: ' + errorMessage);
          } else if (err.response.status === 500) {
            alert('Server error: ' + errorMessage);
          } else {
            alert('Login failed: ' + errorMessage);
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
          alert('Login failed: No response from server.');
        } else {
          console.error('Error setting up request:', err.message);
          alert('Login failed: ' + err.message);
        }
      });
  };

  return (
    <div>
      <h2>{currentRole} Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <button type="submit" className="auth-button">
          Login as {currentRole}
        </button>
      </form>
      <p>
        Don't have an account?{' '}
        <Link to={`/${currentRole.toLowerCase()}/register`}>Create a new account</Link>
      </p>
    </div>
  );
}

export default UserLogin;