import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(email, password, fullName, role);
      if (role === 'farmer') {
        navigate('/farmer-home');
      } else if (role === 'customer') {
        navigate('/customer-home');
      } else {
        navigate('/');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Registration failed');
      setError(message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-icon">🌱</div>

        <h1>Join the Community</h1>
        <p className="subtitle">
          Start your journey with SmartFarmEase today
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">

          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="role">I am a...</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="farmer">🌾 Farmer</option>
              <option value="customer">🛒 Customer</option>
            </select>
          </div>

          <button type="submit" className="register-btn">
            Create Account
          </button>

          <div className="login-link">
            <span>Already have an account?</span>
            <Link to="/login">Sign In</Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;