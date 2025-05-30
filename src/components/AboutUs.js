import React, { useState } from "react";
import "./AboutUs.css";

const faqs = [
  {
    question: "What types of legal documents can be summarized?",
    answer: "We support contracts, agreements, court rulings, and more."
  },
  {
    question: "How accurate is the summarization?",
    answer: "Our AI models are trained on legal texts to ensure high accuracy, though we recommend human review for critical use cases."
  },
  {
    question: "Is my uploaded document secure?",
    answer: "Yes, we use secure encryption and never share your data."
  },
  {
    question: "Do I need to create an account to use the service?",
    answer: "No account is needed for basic summarization, but registration is required for saving and sharing documents."
  },
  {
    question: "Can I download the summarized document?",
    answer: "Yes, you can download your summary in PDF or text format."
  },
  {
    question: "Is the service free to use?",
    answer: "We offer both free and premium plans with additional features for paid users."
  },
  {
    question: "How long does it take to summarize a document?",
    answer: "Most documents are summarized within a few seconds depending on length and complexity."
  },
  {
    question: "Can I summarize handwritten or scanned documents?",
    answer: "Currently, we support text-based PDFs. OCR support is coming soon!"
  },
  {
    question: "Can I share the summary with others?",
    answer: "Yes, summaries can be shared via a public link if you're logged in."
  },
  {
    question: "Who can I contact for support?",
    answer: "You can reach us at support@legalsummaryapp.com for any inquiries."
  }
];

const AboutUs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="about-us-container">
      <h2>About Us</h2>
      <p>
        We are a team dedicated to simplifying legal documents through summarization.
        Our platform uses advanced techniques to process and summarize your documents quickly and accurately.
      </p>

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? "open" : ""}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-question">
              {faq.question}
              <span className="arrow">{openIndex === index ? "▲" : "▼"}</span>
            </div>
            {openIndex === index && <div className="faq-answer">{faq.answer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
