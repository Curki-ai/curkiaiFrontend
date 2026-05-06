import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import "../../Styles/general-styles/FeedbackModal.css";

const FeedbackModal = (props) => {
  console.log(props);
  const [feedback, setFeedback] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mobile,setMobile]=useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mobile.trim()) {
      setErrorMessage("Please enter your mobile number.");
      return;
    }
    if (!feedback.trim()) {
      setErrorMessage("Please enter your feedback before submitting."); 
      return;
    }
    

    setErrorMessage(""); // Clear the error message if feedback is provided
    setIsFeedbackLoading(true);

    // Create the data object for EmailJS
    const templateParams = {
      message: `Feedback: ${feedback}\nPhone Number: +61${mobile}`,
      email_id: props.userEmail,
    };

    emailjs
      .send(
        "service_6otxz7o",         // your EmailJS service ID
        "template_axg34kt",        // your EmailJS template ID
        templateParams,
        "hp6wyNEGYtFRXcOSs"        // your public key
      )
      .then(
        (result) => {
          setIsFeedbackLoading(false);
          // alert("Feedback sent successfully!");
          setFeedback("");
          setIsOpen(false);
        },
        (error) => {
          setIsFeedbackLoading(false);
          alert("Failed to send feedback. Error: " + JSON.stringify(error));
        }
      );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="close-button" onClick={() => setIsOpen(false)}>
          &times;
        </button>
        <div className="get-free-h">Get Free 30 min AI Consultancy</div>
        <div className="book-session">
          Book your session:{" "}
          <a
            href="https://calendly.com/kris-aiagent/30min"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            https://calendly.com/kris-aiagent/30min
          </a>
        </div>
        <div className="modal-title">Session feedback</div>
        <p className="modal-subtitle">Please Submit Your Feedback</p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'20px'}}>
        <div style={{fontSize:'18px',fontWeight:'bold'}}>
          Phone Number :
        </div>
          <div className="mobile-input-wrapper">
            <span className="country-code">+61</span>
            <input
              className="mobile-number"
              type="tel"
              placeholder="0000000000"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
        </div>
        <textarea
          className="feedback-input"
          placeholder="My feedback!!"
          value={feedback}
          required
          onChange={(e) => setFeedback(e.target.value)}
        />
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {isFeedbackLoading ? (
          <div className="feedbackloader"></div>
        ) : (
          <button className="submit-button" onClick={handleSubmit}>
            Submit feedback
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
