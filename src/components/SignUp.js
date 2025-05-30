import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData({
            ...userData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const validateForm = () => {
        if (!userData.username || !userData.email || !userData.password || !userData.confirmPassword) {
            setError('All fields are required');
            return false;
        }
        if (userData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!userData.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/register', {
                username: userData.username,
                email: userData.email,
                password: userData.password
            });
            
            if (response.data.message === 'User registered successfully') {
                navigate('/login');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={userData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={userData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={userData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={userData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>

            <style jsx>{`
                .signup-container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-group input {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                .form-group input:disabled {
                    background-color: #f5f5f5;
                    cursor: not-allowed;
                }

                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }

                button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }

                .error-message {
                    color: red;
                    margin-bottom: 10px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default SignUp;