import React, { useState } from "react";
import {
  auth,
  googleProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from "../firebase";
import "../Styles/SignIn.css";
import emailjs from "@emailjs/browser";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { FaEnvelope, FaKey, FaUser } from "react-icons/fa";

const OldSignIn = ({ show, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  // Handle Sign In or Sign Up
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Show loader
    console.log(isSignUp);

    try {
      if (isSignUp) {
        // Create Firebase user
        await createUserWithEmailAndPassword(auth, email, password);

        // EmailJS notification
        const templateParams = {
          message: "A new user just signed up!",
          email: email,
        };

        try {
          await emailjs.send(
            "service_6otxz7o",
            "template_fxslvkj",
            templateParams,
            "hp6wyNEGYtFRXcOSs"
          );
          console.log("Email sent successfully");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }

        // Mailchimp Welcome flow
        try {
          const mailchimpRes = await fetch(
            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/mailchimp/contact",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email,
                first_name: name,
                last_name: " ",
                tag: "Welcome Flow",
              }),
            }
          );

          const mailchimpData = await mailchimpRes.json();
          if (mailchimpRes.ok) {
            console.log("User added to Mailchimp Welcome flow:", mailchimpData);
          } else {
            console.error("Mailchimp error:", mailchimpData);
          }
        } catch (mailchimpError) {
          console.error("Failed to sync with Mailchimp:", mailchimpError);
        }

        alert("Account created successfully!");
      }

      // Login flow (for both signup and login)
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      onClose(); // Close popup after login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Hide loader
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email in the email field first!");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.log(error);
      setError("Failed to send reset email. Try again.");
    }
  };


  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result?.user?.email);

      if (result._tokenResponse.isNewUser) {
        const newEmail = result?.user?.email;
        const newName = result?.user?.displayName;


        // EmailJS notification
        const templateParams = {
          message: "A new user just signed up!",
          email: newEmail,
        };

        try {
          await emailjs.send(
            "service_6otxz7o",
            "template_fxslvkj",
            templateParams,
            "hp6wyNEGYtFRXcOSs"
          );
          console.log("Email sent successfully");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }

        // Mailchimp Welcome flow
        try {
          const mailchimpRes = await fetch(
            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/mailchimp/contact",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: newEmail,
                first_name: newName,
                last_name: " ",
                tag: "Welcome Flow",
              }),
            }
          );

          const mailchimpData = await mailchimpRes.json();
          console.log("mailchimpData", mailchimpData)
          if (mailchimpRes.ok) {
            console.log("Google user added to Mailchimp Welcome flow:", mailchimpData);
          } else {
            console.error("Mailchimp error:", mailchimpData);
          }
        } catch (mailchimpError) {
          console.error("Failed to sync with Mailchimp:", mailchimpError);
        }
      }

      alert("Google Sign-In successful!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, facebookProvider);
      alert("Facebook Sign-In successful!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="popup">
        {/* <button className="close-btn" onClick={onClose}>×</button> */}

        <div className="signheader">
          {isSignUp ? "Create Your Account" : "Log In"}
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <FaUser
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#aaa",
              }}
            />
            <input
              type="text"
              placeholder="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                paddingLeft: "35px",
                width: "100%",
                height: "40px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <FaEnvelope
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#aaa",
              }}
            />
            <input
              type="email"
              placeholder="Email Address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                paddingLeft: "35px",
                width: "100%",
                height: "40px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ position: "relative", marginBottom: "10px" }}>
            <FaKey
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#aaa",
              }}
            />
            <input
              type="password"
              placeholder="Password *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                paddingLeft: "35px",
                width: "100%",
                height: "40px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div className="loader"></div>
            </div>
          ) : (
            <button type="submit" className="signin-btn" disabled={loading}>
              {isSignUp ? "Create Account" : "Log In"}
            </button>
          )}
        </form>

        {error && (
          <p className="error-message">User Does Not Exist ! Create Account</p>
        )}

        <div className="divider">
          <hr />
          <span style={{ color: "#000000" }}>or continue with</span>
          <hr />
        </div>

        <div className="social-buttons">
          <button
            className="social-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FcGoogle size={28} />
            Google
          </button>
          <button
            className="social-btn"
            onClick={handleFacebookSignIn}
            disabled={loading}
          >
            <FaFacebook size={28} color="#1877F2" />
            Facebook
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "4px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p className="register-text">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account yet?"}
          </p>
          <a
            href="#"
            className="register-link"
            onClick={(e) => {
              e.preventDefault(); // Prevent URL change
              setIsSignUp(!isSignUp);
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </a>
        </div>

        <a href="#"
          className="forgot-link"
          onClick={(e) => {
            e.preventDefault();
            handleForgotPassword();
          }}
        >Forgot password?
        </a>
      </div>
    </div>
  );
};

export default OldSignIn;
