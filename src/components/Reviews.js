import React, { useState } from 'react';
import axios from 'axios';
import './Reviews.css';

const Reviews = () => {
    const [newReview, setNewReview] = useState({
        rating: 0,
        comment: '',
        username: ''
    });
    const [loading, setLoading] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    const handleRatingChange = (rating) => {
        setNewReview({ ...newReview, rating });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReview({ ...newReview, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.rating || !newReview.comment || !newReview.username) {
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:5001/api/reviews', newReview);
            setNewReview({ rating: 0, comment: '', username: '' });
            setShowThankYou(true);
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reviews-page">
            <header className="page-header">
                <h1>Customer Reviews</h1>
                <p>Share your experience with our legal document summarization service</p>
            </header>
            
            <div className="reviews-content">
                <div className="review-description">
                    <h2>Your Feedback Matters</h2>
                    <p>Help us improve our service by sharing your experience with our legal document summarization tool. Your insights help us better serve the legal community.</p>
                </div>

                <div className="review-form-container">
                    {showThankYou && (
                        <div className="thank-you-dialog">
                            <div className="dialog-content">
                                <h3>Thank you for your review!</h3>
                                <button onClick={() => setShowThankYou(false)}>Close</button>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="form-group">
                            <label>Username:</label>
                            <input
                                type="text"
                                name="username"
                                value={newReview.username}
                                onChange={handleInputChange}
                                placeholder="Your name"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Rating:</label>
                            <div className="rating-input">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`star ${i < newReview.rating ? 'filled' : ''}`}
                                        onClick={() => handleRatingChange(i + 1)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Comment:</label>
                            <textarea
                                name="comment"
                                value={newReview.comment}
                                onChange={handleInputChange}
                                placeholder="Share your experience..."
                                rows="4"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Reviews; 