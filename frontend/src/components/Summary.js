import React, { useState } from 'react';

const Summary = () => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size should be less than 10MB');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('document', file);

        try {
            // Try both ports
            let response;
            try {
                response = await fetch('http://localhost:5001/api/summarize', {
                    method: 'POST',
                    body: formData,
                });
            } catch (err) {
                response = await fetch('http://localhost:5002/api/summarize', {
                    method: 'POST',
                    body: formData,
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate summary');
            }

            const data = await response.json();
            if (!data.summary) {
                throw new Error('No summary was generated');
            }
            setSummary(data.summary);
            setProgress(100);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'An error occurred while generating the summary');
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="summary-container">
            <h2>Document Summarizer</h2>
            <div className="upload-section">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={loading}
                />
                {loading && (
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
            </div>
            {summary && (
                <div className="summary-section">
                    <h3>Summary</h3>
                    <p>{summary}</p>
                    <button 
                        className="download-btn"
                        onClick={() => {
                            const blob = new Blob([summary], { type: 'text/plain' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'summary.txt';
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}
                    >
                        Download Summary
                    </button>
                </div>
            )}
        </div>
    );
};

export default Summary; 