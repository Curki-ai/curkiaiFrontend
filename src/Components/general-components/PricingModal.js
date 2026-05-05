import React, { useEffect, useState } from 'react';
import '../../Styles/general-styles/PricingModal.css';
import { PiWarningBold } from "react-icons/pi";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import CurkiLogo from '../../Images/CurkiAiLogo.png';
import TrialClock from '../../Images/TrialClock.png';
import { IoIosArrowDropright } from "react-icons/io";

const PricingModal = ({ email }) => {
    const [paymentStatus, setPaymentStatus] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getDatabase();
    const isDevMode = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

    useEffect(() => {
        if (email && user?.metadata?.creationTime) {
            fetch(`https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/check-payment-status?email=${email}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log("✅ API Response Body:", data);
                    const status = data.status === 'paid' ? 'paid' : 'not paid';
                    setPaymentStatus(status);

                    if (status === 'paid') {
                        const creationTime = user.metadata.creationTime;
                        const paymentTime = new Date().toISOString();

                        set(ref(db, `users/${user.uid}/paymentInfo`), {
                            email: email,
                            creationTime: creationTime,
                            paymentTime: paymentTime,
                            paymentStatus: status,
                        })
                            .then(() => console.log('✅ Payment info updated in DB'))
                            .catch((error) => console.error('❌ Failed to update DB:', error));
                    } else {
                        console.log('ℹ️ Payment not completed, skipping DB update.');
                    }
                })
                .catch(err => {
                    console.error('❌ Error checking payment status:', err);
                    setPaymentStatus('error');
                });
        }
    }, [email, user]);

    // if (paymentStatus === 'paid') {
    //     return null; // Uncomment to hide modal if paid
    // }

    return (
        <div className='pricing-pop-up-layout'>
            <div className="pricing-popup">
                <div className='pricing-context'>
                    <div className='logo-img-div'>
                        <img src={CurkiLogo} alt='curkiLogo' className='logo-img' />
                    </div>
                    <div className='warning'>
                        Your Free Trial Just Ended
                    </div>
                    <div className="offer-tag">But don’t worry  you’re just one<br></br>click away from full, unlimited access.</div>
                    <div className='trial-clock-div'>
                        <img src={TrialClock} alt='trialClock' className='trial-clock-img' />
                    </div>
                </div>
                <div className='feature-context'>
                    <div className='price-unlock'>
                        Unlock Everything for<br></br>Just $49/Month
                    </div>
                    <ul className="features-section">
                        <li><IoIosArrowDropright color='#6C4CDC' size={20}/>1 User</li>
                        <li><IoIosArrowDropright color='#6C4CDC' size={20}/>Unlimited use</li>
                        <li><IoIosArrowDropright color='#6C4CDC' size={20}/>All Features Included</li>
                        <li><IoIosArrowDropright color='#6C4CDC' size={20}/>No Commitment Cancel</li>
                    </ul>
                    <button
                    className="buy-button"
                    onClick={() => {
                        const emailParam = `?prefilled_email=${email}`;
                        const devUrl = `https://buy.stripe.com/test_4gM7sMcd199udwEaxD5kk00${emailParam}`;
                        const prodUrl = `https://buy.stripe.com/3csbJ40Bv5Y26mQfYY${emailParam}`;
                        window.location.href = isDevMode ? devUrl : prodUrl;
                    }}
                >
                    Get Full Access
                </button>
                <div className='promotional-text'>
                That’s less than $1.65 a day for unlimited power.
                </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
