import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Legal Summarization</h1>
        <p>Your legal documents, simplified.</p>
        <Link to="/summarize" className="get-started-btn">Get Started</Link>
      </div>
    </div>
  );
};

export default Home;