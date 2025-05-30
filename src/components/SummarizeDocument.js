import React, { useState } from 'react';
import axios from 'axios';
import './SummarizeDocument.css';

const SummarizeDocument = () => {
  const [document, setDocument] = useState('');
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setDocument(e.target.value);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const summarizeDocument = async () => {
    if (!document && !file) {
      setError('Please provide either text or a file to summarize.');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('document', file); // Must match backend key
      } else {
        const blob = new Blob([document], { type: 'text/plain' });
        formData.append('document', blob, 'input.txt');
      }

      const response = await axios.post('http://localhost:3000/api/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error summarizing document:', error);
      setError('Failed to summarize document. Please try again later.');
    }

    setLoading(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/download-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: summary }), // Send the actual summary
      });

      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "summary.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="summarize-container">
      <h2>Summarize Document</h2>

      <div className="textarea-container">
        <textarea
          value={document}
          onChange={handleInputChange}
          placeholder="Paste your document here..."
        />
      </div>

      <div className="file-input-container">
        <input
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={handleFileChange}
        />
      </div>

      <button onClick={summarizeDocument} disabled={loading}>
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {summary && (
        <button onClick={handleDownload} className="download-button">
          Download Summary
        </button>
      )}

      <div className="summary-container">
        <h3>Summary:</h3>
        {summary && <p>{summary}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default SummarizeDocument;
