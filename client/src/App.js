import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import './App.css';

function App() {
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    
    // Original input state variables
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    
    // Original application flow state
    const [message, setMessage] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    
    // Authentication mode state to toggle between register and login
    const [authMode, setAuthMode] = useState('register');
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    const handleRegister = async (e) => {
        e.preventDefault();

        // Email validation remains the same
        const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
        if (!emailPattern.test(email)) {
            setMessage('Email must end with @spelman.edu or @morehouse.edu.');
            return;
        }

        try {
            const response = await axios.post('/register', { name, email, password });
            console.log("Registration API response:", response);
            setMessage(response.data.message || 'Verification code sent to your email!');
            setIsEmailSent(true); // Show verification step
        } catch (error) {
            setMessage('Error during registration: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('/login', { email, password });
            console.log("Login API response:", response);
            
            if (response.data.success) {
                setName(response.data.name || 'User');
                setMessage('Login successful!');
                setIsVerified(true); 
            } else {
                setMessage(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            setMessage('Error during login: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleVerifyEmail = async () => {
        try {
            const response = await axios.post('/verify', { email, verificationCode });
            setMessage(response.data.message || 'Email verified successfully!');
            
            if (response.data.success) {
                setIsVerified(true); // Show dashboard
            }
        } catch (error) {
            setMessage('Invalid verification code.');
        }
    };

    const handleLogout = () => {
        // Reset all states except authMode
        setName('');
        setEmail('');
        setPassword('');
        setMessage('');
        setVerificationCode('');
        setIsEmailSent(false);
        setIsVerified(false);
    };

    const toggleAuthMode = () => {
        setAuthMode(authMode === 'register' ? 'login' : 'register');
        setMessage('');
    };

    // ==========================================
    // COMPONENT RENDERING FUNCTIONS
    // ==========================================
    
    const renderLoginForm = () => (
        <form onSubmit={handleLogin}>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Login</button>
        </form>
    );

    const renderRegistrationForm = () => (
        <form onSubmit={handleRegister}>
            <div>
                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Register</button>
        </form>
    );

    const renderVerificationForm = () => (
        <div>
            <h2>Verify Your Email</h2>
            <label>Enter Verification Code</label>
            <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
            />
            <button onClick={handleVerifyEmail}>Verify</button>
        </div>
    );

    // ==========================================
    // MAIN RENDER FUNCTION
    // ==========================================
    return (
        <div className="App">
            {/* NEW: Changed app title */}
            <div className="app-header">
                {!isVerified && <h1>Doctor Finder</h1>}
            </div>
            
            {!isVerified ? (
                <>
                    {isEmailSent ? (
                        renderVerificationForm()
                    ) : (
                        <>
                            {/* Tab navigation for switching between register and login */}
                            <div className="auth-tabs">
                                <button 
                                    className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('register')}
                                >
                                    Register
                                </button>
                                <button 
                                    className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('login')}
                                >
                                    Login
                                </button>
                            </div>
                            
                            {/* Description text explaining the app */}
                            <div className="app-description">
                                <p>
                                    Find doctors in the Atlanta area based on specialty, 
                                    insurance, and location.
                                </p>
                                <p className="small-text">
                                    {authMode === 'register' ? 
                                        'Register with your academic email to get started.' : 
                                        'Login to access the doctor finder.'}
                                </p>
                            </div>
                            
                            {/* Conditionally render either registration or login form */}
                            {authMode === 'register' ? renderRegistrationForm() : renderLoginForm()}
                        </>
                    )}
                </>
            ) : (
                /* Pass the Dashboard component the authenticated user info */
                <Dashboard 
                    name={name} 
                    email={email} 
                    onLogout={handleLogout} 
                />
            )}
            
            {/* Message display */}
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default App;