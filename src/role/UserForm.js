import React, { useState } from 'react';
import { Link, Route, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import UserLogin from "./UserLogin"; // your UserLogin.js file


function UserRegister() {
  const location = useLocation();
  const { role } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: role ? role.toUpperCase() : 'USER',
  });

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Prevent uppercase letters in email
    if (name === "email") {
      value = value.toLowerCase();
    }

    setFormData({ ...formData, [name]: value });
  };

  const passwordsMatch = () => formData.password === formData.confirmPassword;

  const isValidName = (name) => /^[A-Za-z\s]+$/.test(name); // letters and spaces only
  const isValidEmail = (email) =>
    /^[a-z0-9._%+-]+@gmail\.com$/i.test(email); // "i" = ignore case
 // lowercase email format
  const isValidPassword = (password) => password.length >= 8;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidName(formData.name)) {
      alert("Name should not contain numbers or special characters.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      alert("Email must be in lowercase and a valid format.");
      return;
    }

    if (!isValidPassword(formData.password)) {
      alert("Password must be more than 8 characters.");
      return;
    }

    if (!passwordsMatch()) {
      alert("Passwords don't match!");
      return;
    }

    const { confirmPassword, ...userData } = formData;
console.log("=== SENDING TO BACKEND ===");
    console.log("Raw userData:", userData);
    console.log("JSON stringified:", JSON.stringify(userData));
    const endpoint = `${process.env.REACT_APP_API_BASE_URL}/user/register`;
console.log("API URL:", process.env.REACT_APP_API_BASE_URL);

    axios
      .post(endpoint, userData)
      .then((res) => {
        alert(`${role} registered successfully!`);
        console.log(res.data);
      })
     .catch((err) => {
  console.log("=== FULL ERROR DEBUG ===");
  console.log("Response data:", err.response?.data);
  console.log("Response status:", err.response?.status);
  console.log("Response headers:", err.response?.headers);
  
  let errorMsg = "Unknown error";
  if (err.response?.data) {
    console.log("Backend error details:", err.response.data);
    errorMsg = JSON.stringify(err.response.data);
  }
  
  alert("Error: " + errorMsg);
});
  };

  return (
    <div>
      <h2>{role} Register</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          type="text"
          placeholder="Full Name"
          required
        />
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          placeholder="Email"
          required
        />
        <input
          name="password"
          value={formData.password}
          onChange={handleChange}
          type="password"
          placeholder="Password (min 8 characters)"
          required
        />
        <input
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          type="password"
          placeholder="Re-enter Password"
          required
        />

        <button type="submit" className="auth-button">
          Register as {role}
        </button>
      </form>
      <p>
        Already have an account?{' '}
  <Link to={`/login/${role}`}>
    Login here
  </Link>     
   </p>
    </div>
  );
}

export default UserRegister;
