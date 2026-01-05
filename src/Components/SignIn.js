import React, { useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  onAuthStateChanged,
} from "../firebase";
import "../Styles/SignIn.css";
import emailjs from "@emailjs/browser";
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope, FaKey, FaUser } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FiLock } from "react-icons/fi";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import { CiWarning } from "react-icons/ci";
import { IoPersonOutline } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";

const SignIn = ({ show, onClose }) => {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isOrganizationFocused, setIsOrganizationFocused] = useState(false);
  const [isPassWordFocused, setIsPasswordFocused] = useState(false);
  const [isNewPassWordFocused, setIsNewPasswordFocused] = useState(false);
  const [isConfirmNewPasswordFocused, setIsConfirmNewPasswordFocused] = useState(false);
  const [isagreedToTc, setIsagreedToTc] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');


  useEffect(() => {
    const pendingEmail = localStorage.getItem("emailForVerification");
    if (pendingEmail) {
      setEmail(pendingEmail);
      setStep("verify-email");
    }
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;

      await firebaseUser.reload();
      const freshUser = auth.currentUser;

      if (!freshUser?.emailVerified) return;

      const emailForVerification = localStorage.getItem("emailForVerification");
      if (!emailForVerification) return; // 🚫 Not coming from verify flow

      // ✅ One-time success
      localStorage.removeItem("emailForVerification");

      alert("Email verified! Logged in successfully.");
      onClose(); // or navigate
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (step !== "verify-email") return;

    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await user.reload();

      if (user.emailVerified) {
        localStorage.removeItem("emailForVerification");
        clearInterval(interval);

        alert("Email verified! Logged in successfully.");
        onClose(); // or navigate
      }
    }, 3000); // check every 3 seconds

    return () => clearInterval(interval);
  }, [step]);



  if (!show) return null;



  const handleContinueWithEmail = async () => {
    setError("");
    setLoading(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length === 0) {
        // 🆕 New user
        setIsSignUp(true);
        setStep("signup");

      } else if (methods.includes("password")) {
        // 🔐 Existing email/password user
        setIsSignUp(false);
        setStep("login");

      } else {
        // 🔵 Google / Facebook user
        setError(
          "This email is already linked with Google or Facebook. Please continue using that option."
        );
      }

    } catch (err) {
      // ✅ Handle invalid email nicely
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }

    } finally {
      setLoading(false);
    }
  };



  // Handle Sign In or Sign Up
  const handleAuth = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("Password should be at least 8 characters");
      return;
    }
    if (confirmNewPassword !== newPassword) {
      setPasswordError('Password and confirm password is not matching');
      return;
    }
    setIsCreatingAccount(true) // Show loader

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        newPassword
      );

      const user = userCredential.user;

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
      await sendEmailVerification(user);
      localStorage.setItem("emailForVerification", email);
      setStep("verify-email");
      setIsCreatingAccount(false);
      return;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingAccount(false); // Hide loader
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

  const handleLoginwithEmailPassword = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      onClose();
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Incorrect password. Try again or reset it.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
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



  return (
    <div className="overlay-sign">
      <div className="popup-sign">
        {/* <button className="close-btn" onClick={onClose}>×</button> */}
        {step === '' &&
          <div>
            <div style={{ textAlign: 'center', fontSize: '33px', fontWeight: '700', fontFamily: 'Inter', color: '#17175' }}>Welcome to Curki AI</div>
            <div style={{ fontSize: '22px', color: '#707493', fontWeight: '500', marginTop: '6px', textAlign: 'center', marginBottom: '30px' }}>Get clarity in minutes</div>


            <div className="social-buttons">
              <button
                className="social-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <FcGoogle size={28} />
                Continue with Google
              </button>
            </div>
            <div className="dividerss">
              <hr />
              <span style={{ color: "#969ab8" }}>or</span>
              <hr />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '16px', fontFamily: 'Inter', color: '#707493', marginBottom: '10px', textAlign: 'left', fontWeight: '500' }}>Enter your email to Login or Create an account.</div>
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <MdOutlineEmail
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: isEmailFocused ? "#000000" : "#8b8b8b",
                  }}
                  size={20}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  required
                  style={{
                    padding: '12px 20px',
                    width: "100%",
                    height: "50px",
                    boxSizing: "border-box",
                    border: `1.6px solid ${isEmailFocused ? '#6c4cdc' : '#e0e2e9'}`,
                    borderRadius: '40px',
                    fontSize: '14px',
                    outline: 'none',
                    paddingLeft: '45px',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'red', fontWeight: '400', marginBottom: '6px', textAlign: 'left' }}><CiWarning size={20} />{error}</div>}
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
              <button className="signin-btn" disabled={loading || email === ''} onClick={handleContinueWithEmail}>
                Continue with email
              </button>
            )}
          </div>
        }
        {step === 'login' &&
          <div>
            <div style={{ textAlign: 'center', fontSize: '33px', fontWeight: '700', fontFamily: 'Inter', color: '#17175' }}>Welcome back !</div>
            <div style={{ fontSize: '16px', color: '#707493', fontWeight: '500', marginTop: '6px', textAlign: 'center', marginBottom: '30px' }}>Enter Your Password to continue</div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: isPassWordFocused ? "#000000" : "#8b8b8b",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                style={{
                  padding: '12px 20px',
                  width: "100%",
                  height: "50px",
                  boxSizing: "border-box",
                  border: `1.6px solid ${isPassWordFocused ? '#6c4cdc' : '#e0e2e9'}`,
                  borderRadius: '40px',
                  fontSize: '14px',
                  paddingLeft: '45px',
                  paddingRight: '45px',
                  outline: 'none'
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
              </div>
            </div>
            {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'red', fontWeight: '400', marginBottom: '6px' }}><CiWarning size={20} />{error}</div>}
            <div
              style={{ textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6C4CDC', fontFamily: 'Inter', cursor: 'pointer', marginTop: '4px', marginBottom: '32px' }}
              onClick={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}>
              Forgot your password?
            </div>
            <button className="signin-btn" disabled={password === '' || isLoggingIn} onClick={handleLoginwithEmailPassword}>
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
            <div
              style={{ fontSize: '14px', fontWeight: '600', marginTop: '20px', cursor: 'pointer', color: '#707493', fontFamily: 'Inter' }}
              onClick={() => { setStep(''); setPassword(''); setEmail('') }}
            >
              Use another account
            </div>
          </div>
        }
        {step === 'signup' &&
          <div>
            <div style={{ textAlign: 'center', fontSize: '33px', fontWeight: '700', fontFamily: 'Inter', color: '#17175' }}>Create your Curki account</div>
            <div style={{ fontSize: '16px', color: '#707493', fontWeight: '500', marginTop: '6px', textAlign: 'center', marginBottom: '30px', lineHeight: '22px' }}>No account found for <span style={{ fontWeight: '500', color: 'black' }}>{email}</span>.<br></br> Let’s create one.</div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <IoPersonOutline
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: isNameFocused ? "#000000" : "#8b8b8b",
                }}
                size={20}
              />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                required
                style={{
                  padding: '12px 20px',
                  width: "100%",
                  height: "50px",
                  boxSizing: "border-box",
                  border: `1.6px solid ${isNameFocused ? '#6c4cdc' : '#e0e2e9'}`,
                  borderRadius: '40px',
                  fontSize: '14px',
                  outline: 'none',
                  paddingLeft: '45px'
                }}
              />
            </div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <BsBuildings
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: isOrganizationFocused ? "#000000" : "#8b8b8b",
                }}
                size={20}
              />
              <input
                type="text"
                placeholder="Organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                onFocus={() => setIsOrganizationFocused(true)}
                onBlur={() => setIsOrganizationFocused(false)}
                required
                style={{
                  padding: '12px 20px',
                  width: "100%",
                  height: "50px",
                  boxSizing: "border-box",
                  border: `1.6px solid ${isOrganizationFocused ? '#6c4cdc' : '#e0e2e9'}`,
                  borderRadius: '40px',
                  fontSize: '14px',
                  outline: 'none',
                  paddingLeft: '45px'
                }}
              />
            </div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: isNewPassWordFocused ? "#000000" : "#8b8b8b",
                }}
              />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setIsNewPasswordFocused(true)}
                onBlur={() => setIsNewPasswordFocused(false)}
                required
                style={{
                  padding: '12px 20px',
                  width: "100%",
                  height: "50px",
                  boxSizing: "border-box",
                  border: `1.6px solid ${isNewPassWordFocused ? '#6c4cdc' : '#e0e2e9'}`,
                  borderRadius: '40px',
                  fontSize: '14px',
                  paddingLeft: '45px',
                  paddingRight: '45px',
                  outline: 'none'
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                }}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
              </div>
            </div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: isConfirmNewPasswordFocused ? "#000000" : "#8b8b8b",
                }}
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmNewPassword}
                onFocus={() => setIsConfirmNewPasswordFocused(true)}
                onBlur={() => setIsConfirmNewPasswordFocused(false)}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                style={{
                  padding: '12px 20px',
                  width: "100%",
                  height: "50px",
                  boxSizing: "border-box",
                  border: `1.6px solid ${isConfirmNewPasswordFocused ? '#6c4cdc' : '#e0e2e9'}`,
                  borderRadius: '40px',
                  fontSize: '14px',
                  paddingLeft: '45px',
                  paddingRight: '45px',
                  outline: 'none'
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <PiEyeLight size={20} /> : <PiEyeSlash size={20} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '30px', marginBottom: '30px' }}>
              <input
                type="checkbox"
                onChange={() => setIsagreedToTc(!isagreedToTc)}
                className="tc-checkbox"
              />
              <div style={{ textAlign: 'left', fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', color: '#969AB8', lineHeight: '20px' }}>We’ll never share your email. By continuing you agree to our  <a
                href="https://www.curki.ai/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontWeight: 'bold',
                  color: 'black',
                  fontFamily: 'Inter',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Privacy Policy
              </a>.</div>
            </div>
            {passwordError && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'red', fontWeight: '400', marginBottom: '6px', textAlign: 'left' }}><CiWarning size={20} />{passwordError}</div>}
            <button className="signin-btn" disabled={name === '' || newPassword === '' || confirmNewPassword === '' || !isagreedToTc} onClick={handleAuth}>
              {isCreatingAccount ? "Creating account..." : "Create Account"}
            </button>
            <div
              style={{ fontSize: '14px', fontWeight: '600', marginTop: '20px', cursor: 'pointer', color: '#707493', fontFamily: 'Inter' }}
              onClick={() => { setStep(''); setNewPassword(''); setEmail(''); setName(''); setOrganization(''); setNewPassword(''); setConfirmNewPassword('') }}
            >
              Back
            </div>
          </div>
        }
        {step === "verify-email" &&
          <div>
            <div style={{ textAlign: 'center', fontSize: '33px', fontWeight: '700', fontFamily: 'Inter' }}>Check Your Inbox</div>
            <div style={{ fontSize: '16px', color: '#707493', fontWeight: '500', marginTop: '6px', textAlign: 'center', marginBottom: '30px' }}>We’ve sent a verification link to<br></br><span style={{ fontWeight: '500', color: '#0E0C16' }}>{email}</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', color: '#707493', marginBottom: '30px', lineHeight: '20px' }}>
              Open the email and click the link to verify your account.<br></br>If you don’t see it, please check your spam or junk folder.
            </div>
            <button className="signin-btn"
              onClick={async () => {
                const user = auth.currentUser;
                if (user) {
                  await sendEmailVerification(user);
                  alert("Verification email resent!");
                }
              }}>
              Resend
            </button>
            <div
              style={{ fontSize: '14px', fontWeight: '600', marginTop: '20px', cursor: 'pointer', color: '#707493', fontFamily: 'Inter' }}
              onClick={() => { setStep(''); setPassword(''); setEmail('') }}
            >
              Use another account
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default SignIn;
