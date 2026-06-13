import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [authSettings, setAuthSettings] = useState({ providers: {}, requireEmailVerification: false });
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMsg, setVerificationMsg] = useState('');
  const { login, register } = useAuth();

  useEffect(() => {
    api.getAuthSettings().then(setAuthSettings).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        const result = await register(form.username, form.email, form.password, form.display_name);
        if (authSettings.requireEmailVerification) {
          setShowVerification(true);
          await api.sendVerificationCode();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationMsg('');
    try {
      const result = await api.verifyEmail(verificationCode);
      setVerificationMsg('Email verified successfully!');
      setTimeout(() => {
        setShowVerification(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    try {
      await api.sendVerificationCode();
      setVerificationMsg('New code sent! Check console for dev mode.');
    } catch (err) {
      setError(err.message || 'Failed to send code');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    if (!forgotEmail) return setError('Please enter your email');
    try {
      const API_BASE = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg('If the email exists, a reset link has been sent. Check console for dev token.');
        console.log('Password reset token:', data.resetToken);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  // Handle OAuth login redirect
  const handleSocialLogin = (provider) => {
    const API_BASE = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
    window.location.href = `${API_BASE}/api/auth/${provider}`;
  };

  // Check if returning from OAuth with token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const oauthError = params.get('oauth_error');
    const oauthSuccess = params.get('oauth_success');
    
    // Clean up URL
    if (oauthSuccess || oauthError || token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (token) {
      localStorage.setItem('mimis_token', token);
      if (userStr) {
        try {
          localStorage.setItem('mimis_user', decodeURIComponent(userStr));
        } catch {}
      }
      window.location.reload();
    }
    
    if (oauthError) {
      const errorMessages = {
        'disabled': 'This login method is currently disabled',
        'failed': 'Login failed. Please try again',
        'no_user': 'Could not authenticate. Please try a different method',
        'invalid': 'Invalid login method'
      };
      setError(errorMessages[oauthError] || 'Login failed');
    }
  }, []);

  if (showVerification) {
    return (
      <div className='login-page'>
        <div className='login-container'>
          <div className='login-header'>
            <h1 className='login-logo'>Mimu Arts</h1>
            <p className='login-subtitle'>Verify your email</p>
          </div>
          <form className='login-form' onSubmit={handleVerifyEmail}>
            <h2>Email Verification</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              We've sent a 6-digit code to your email. Enter it below.
            </p>
            <div className='input-group'>
              <input type='text' placeholder='Enter 6-digit code' value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)} required maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} />
            </div>
            {error && <div className='error-msg'>{error}</div>}
            {verificationMsg && <div className='success-msg'>{verificationMsg}</div>}
            <button type='submit' className='login-btn' disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button type='button' className='forgot-link' onClick={handleResendCode}>
              Resend Code
            </button>
            <button type='button' className='forgot-back-btn' onClick={() => { setShowVerification(false); setError(''); }}>
              Skip for now
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgot) {
    return (
      <div className='login-page'>
        <div className='login-container'>
          <div className='login-header'>
            <h1 className='login-logo'>Mimu Arts</h1>
            <p className='login-subtitle'>Reset your password</p>
          </div>
          <form className='login-form' onSubmit={handleForgotPassword}>
            <h2>Forgot Password</h2>
            <div className='input-group'>
              <input type='email' placeholder='Your email address' value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            </div>
            {error && <div className='error-msg'>{error}</div>}
            {forgotMsg && <div className='success-msg'>{forgotMsg}</div>}
            <button type='submit' className='login-btn' disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type='button' className='forgot-back-btn' onClick={() => { setShowForgot(false); setError(''); setForgotMsg(''); }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const socialProviders = [
    { id: 'google', name: 'Google', color: '#EA4335', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.93c1.73 0 3.3.61 4.54 1.8l3.42-3.42C17.94 1.19 15.12 0 12 0 7.36 0 3.33 2.64 1.48 6.39l3.79 3.37z"/><path fill="#34A853" d="M16.54 18.4A7.08 7.08 0 0 1 12 19.07c-2.81 0-5.24-1.64-6.37-4.01L1.8 18.53C3.66 22.3 7.63 24 12 24c3.02 0 5.95-1.07 8.16-3.06l-3.62-2.54z"/><path fill="#4A90F6" d="M24 12.26c0-.86-.08-1.7-.24-2.52H12v5.1h6.98c-.3 1.56-1.17 2.84-2.44 3.66l3.62 2.54c2.1-1.95 3.84-4.83 3.84-8.78z"/></svg> },
    { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { id: 'x', name: 'X (Twitter)', color: '#000000', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'apple', name: 'Apple', color: '#000000', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#000" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg> },
    { id: 'github', name: 'GitHub', color: '#333', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#333" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
    { id: 'discord', name: 'Discord', color: '#5865F2', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#5865F2" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg> },
    { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  ];

  return (
    <div className='login-page'>
      <div className='login-container'>
        <div className='login-header'>
          <h1 className='login-logo'>Mimu Arts</h1>
          <p className='login-subtitle'>Share your moments</p>
        </div>

        <form className='login-form' onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          {!isLogin && (
            <>
              <div className='input-group'>
                <input type='text' name='username' placeholder='Username' value={form.username} onChange={handleChange} required />
              </div>
              <div className='input-group'>
                <input type='text' name='display_name' placeholder='Display Name (optional)' value={form.display_name} onChange={handleChange} />
              </div>
            </>
          )}

          <div className='input-group'>
            <input type='email' name='email' placeholder='Email address' value={form.email} onChange={handleChange} required />
          </div>

          <div className='input-group'>
            <input type='password' name='password' placeholder='Password' value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          {error && <div className='error-msg'>{error}</div>}

          <button type='submit' className='login-btn' disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>

          {isLogin && (
            <button type='button' className='forgot-link' onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          )}
        </form>

        {/* Social Login */}
        <div className='social-divider'>
          <span className='divider-line'></span>
          <span className='divider-text'>or continue with</span>
          <span className='divider-line'></span>
        </div>

        <div className='social-buttons'>
          {socialProviders.map(provider => (
            authSettings.providers[provider.id] !== false && (
              <button key={provider.id} type='button' className='social-btn'
                style={{ borderColor: provider.color + '33' }}
                onClick={() => handleSocialLogin(provider.id)} disabled={loading}>
                {provider.icon}
                {provider.name}
              </button>
            )
          ))}
        </div>

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