import React, { useState } from 'react';
import './LoginPage.css';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password, form.display_name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-container'>
        <div className='login-header'>
          <h1 className='login-logo'>Mimi's</h1>
          <p className='login-subtitle'>Share your moments</p>
        </div>

        <form className='login-form' onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          {!isLogin && (
            <>
              <div className='input-group'>
                <input
                  type='text'
                  name='username'
                  placeholder='Username'
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='input-group'>
                <input
                  type='text'
                  name='display_name'
                  placeholder='Display Name (optional)'
                  value={form.display_name}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className='input-group'>
            <input
              type='email'
              name='email'
              placeholder='Email address'
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className='input-group'>
            <input
              type='password'
              name='password'
              placeholder='Password'
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {error && <div className='error-msg'>{error}</div>}

          <button type='submit' className='login-btn' disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>

          <div className='login-test'>
            <p>Test Account:</p>
            <code>mimi@example.com / password123</code>
          </div>
        </form>

        <div className='login-toggle'>
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button className='toggle-btn' onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;