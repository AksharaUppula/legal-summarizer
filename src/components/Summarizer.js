import React, { useState } from 'react';
import axios from 'axios';
import './Summarizer.css';

const Summarizer = () => {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSummary('');
            setOriginalText('');
        }
    };

    const handleSummarize = async () => {
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('document', file);

        // Try both possible ports
        const ports = [5001, 5002];
        let success = false;

        for (const port of ports) {
            if (success) break;
            
            try {
                const response = await axios.post(`http://localhost:${port}/api/summarize`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                });

                if (response.data.error) {
                    throw new Error(response.data.error);
                }

                setOriginalText(response.data.originalText);
                setSummary(response.data.summary);
                setProgress(100);
                success = true;
            } catch (err) {
                if (port === ports[ports.length - 1]) {
                    console.error('Summarization error:', err);
                    setError(err.response?.data?.details || err.response?.data?.error || 
                            'Error connecting to the server. Please ensure the backend is running.');
                }
            }
        }

        setLoading(false);
    };

    return (
        <div className="summarizer-container">
            <div className="summarizer-content">
                <div className="logo-container">
                    <img src="../legal.jpeg" alt="Legal Document Summarizer Logo" className="logo" />
                </div>
                <h2>Legal Outline</h2>
                
                <div className="input-section">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="file-input"
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSummarize}
                        disabled={loading || !file}
                        className="summarize-button"
                    >
                        {loading ? 'Processing...' : 'Summarize'}
                    </button>
                </div>

                {loading && (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                        <div className="progress-text">{progress}%</div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {originalText && (
                    <div className="text-section">
                        <h3>Original Text</h3>
                        <div className="text-content">{originalText}</div>
                    </div>
                )}

                {summary && (
                    <div className="summary-section">
                        <h3>Summary</h3>
                        <div className="summary-content">
                            {summary}
                        </div>
                        <button 
                            className="download-btn"
                            onClick={() => {
                                const element = document.createElement("a");
                                const file = new Blob([summary], {type: 'text/plain'});
                                element.href = URL.createObjectURL(file);
                                element.download = "legal_summary.txt";
                                document.body.appendChild(element);
                                element.click();
                                document.body.removeChild(element);
                            }}
                        >
                            Download Summary
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Summarizer; 