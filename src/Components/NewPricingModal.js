import React, { useState } from "react";
import "../Styles/NewPricingModal.css";
import { IoClose } from "react-icons/io5";
import pricingTick from "../Images/pricingmodaltick.png"
import ComparePlans from "./ComparePlans";
import emailjs from "@emailjs/browser";

const PricingPlansModal = ({ onClose, email: userEmail, firstName: firstName, setSubscriptionInfo }) => {
    console.log("User Email:", userEmail); // For debugging
    const [billing, setBilling] = useState("monthly");
    const [showCompare, setShowCompare] = useState(false);
    const PLAN_KEY_MAP = {
        "Profit Lift Starter": "profit_lift_starter",
        "Margin Starter": "margin_starter",
        "Margin Pilot – Growth": "margin_pilot_growth",
        "Profit with Compliance – Pro": "profit_compliance_pro",
    };
    const handleCheckout = async ({ planKey }) => {
        try {
            if (!userEmail) {
                console.error("User email missing");
                return;
            }

            const payload = {
                email: userEmail,
                planKey,
                billingInterval: billing, // monthly / yearly
            };

            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/subscription/checkout",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.checkoutUrl) {
                console.error("Checkout failed", data);
                return;
            }

            window.location.href = data.checkoutUrl;
        } catch (err) {
            console.error("Payment error", err);
        }
    };


    return (
        <div className="pricing-overlay">
            <div className="pricing-container">
                {/* Top bar */}
                <div className="pricing-top">
                    <div></div>
                    <button className="pricing-close" onClick={onClose}>
                        <IoClose size={22} />
                    </button>
                </div>

                {/* Header */}
                <div className="pricing-header">
                    <h2>Choose a plan that fits your team</h2>
                    <p style={{ fontSize: "16px", fontWeight: 500, lineHeight: "24px", color: "#707493" }}>
                        Start <span>free for 15 days</span>. No credit card required. Cancel
                        anytime.
                    </p>

                    <div className="billing-toggle">
                        <button
                            className={billing === "monthly" ? "active" : ""}
                            onClick={() => setBilling("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={billing === "yearly" ? "active" : ""}
                            onClick={() => setBilling("yearly")}
                        >
                            Yearly <span style={{ color: "#39BA57", fontStyle: "italic" }}>20% off</span>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="plans-wrapper">
                    <Plan
                        title="Profit Lift Starter"
                        planKey="profit_lift_starter"
                        monthly={199}
                        yearly={1910.40}
                        billing={billing}
                        features={[
                            "CFO-grade dashboard",
                            "Margin drivers & cash impact",
                            "Actions to stop leaks",
                            "Financial health",
                            "Client profitability",
                            "15 AI clicks included",
                        ]}
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Margin Starter"
                        planKey="margin_starter"
                        monthly={399}
                        yearly={3830.40}
                        billing={billing}
                        popular
                        features={[
                            "Lift EBITDA",
                            "Reduce OT & vacancy drag",
                            "Financial health",
                            "Client profitability",
                            "Smart rostering (1000 SMS Included)",
                            "50 AI clicks included",
                        ]}
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Margin Pilot – Growth"
                        planKey="margin_pilot_growth"
                        monthly={699}
                        yearly={6710.40}
                        billing={billing}
                        features={[
                            "Lift EBITDA",
                            "Reduce OT & vacancy drag",
                            "Event & incident management",
                            "Incident auditing",
                            "Smart rostering (1000 SMS)",
                            "150 AI clicks included",
                        ]}
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Profit with Compliance – Pro"
                        planKey="profit_compliance_pro"
                        monthly={999}
                        yearly={9590.40}
                        billing={billing}
                        features={[
                            "CFO-grade finance",
                            "Al ops + compliance pack",
                            "Quality & risk reporting",
                            "SIRS analysis",
                            "Smart rostering (2000 SMS)",
                            "Incident reports",
                            "300 AI clicks included",
                        ]}
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />
                </div>

                {/* Enterprise */}
                <div className="enterprise">
                    <div className="enterprise-content">
                        <h3 className="enterprise-title">Custom Enterprise</h3>

                        <div className="enterprise-features">
                            <ul className="feature-list">
                                <li>
                                    <img src={pricingTick} />
                                    <span>CFO-grade dashboard</span>
                                </li>
                                <li>
                                    <img src={pricingTick} alt="tick" />
                                    <span>Dedicated manager</span>
                                </li>
                            </ul>

                            <ul className="feature-list">
                                <li>
                                    <img src={pricingTick} alt="tick" />
                                    <span>Custom AI volumes</span>
                                </li>
                                <li>
                                    <img src={pricingTick} alt="tick" />
                                    <span>Custom integrations</span>
                                </li>
                            </ul>
                        </div>
                    </div>



                    <button className="outline-btn">Contact Sales</button>
                </div>
                {showCompare && (
                    <ComparePlans />
                )}

            </div>
        </div>
    );
};

const Plan = ({ title, planKey, monthly, yearly, billing, features, popular, onCompare, onCheckout, userEmail, onClose, firstName, setSubscriptionInfo }) => {
    const price = billing === "monthly" ? monthly : yearly;
    const startTrial = async () => {
        try {
            // 1️⃣ Start trial in your system
            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/subscription/start-trial",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: userEmail }),
                }
            );

            if (!res.ok) {
                console.error("Trial start failed");
                return;
            }
            const data = await res.json();
            console.log("Trial started:", data);
            // Update Mailchimp tag
            // await fetch(
            //     "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/mailchimp/contact",
            //     {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify({
            //             email: userEmail,
            //             first_name: firstName || "",
            //             last_name: " ",
            //             tag: "trial_started",
            //         }),
            //     }
            // );

            setSubscriptionInfo({
                subscription_type: "trial",
                trial_end: data?.trial?.trial_end,
            });
            // Close pricing modal

            onClose();
        } catch (err) {
            console.error("Start trial error:", err);
        }
    };

    return (
        <div
            className={`plan-card ${popular ? "popular" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onCheckout({ planKey })}
        >
            <div className="plan-header">
                <h4>{title}</h4>
                {popular && <span className="popular-badge">Popular</span>}
            </div>

            <div className="price">
                <span className="price-currency">$</span>
                <span className="price-amount">{price}</span>
                <span className="price-duration">
                    {billing === "monthly" ? "/month" : "/year"}
                </span>
            </div>



            <ul className="feature-list" style={{ padding: 0 }}>
                {features.map((item, index) => {
                    const isSpecialCase = (
                        title === "Margin Pilot – Growth" &&
                        item === "Event & incident management"
                    ) || (title === "Margin Starter" && item === "Smart rostering (1000 SMS Included)");

                    return (
                        <li
                            key={index}
                            style={isSpecialCase ? { height: "38px" } : {}}
                        >
                            <img src={pricingTick} alt="tick" />
                            <span>{item}</span>
                        </li>
                    );
                })}
            </ul>



            <div className="plan-actions">
                <button
                    className={
                        popular
                            ? "primary-btn popular-btn"
                            : "primary-btn outline-plan-btn"
                    }
                    onClick={(e) => {
                        e.stopPropagation();
                        startTrial();
                    }}
                >
                    Start 15-day free trial
                </button>

                <div className="compare" onClick={(e) => {
                    e.stopPropagation(); // CRITICAL
                    onCompare();
                }}>
                    Compare plans
                </div>

            </div>

        </div>
    );
};

export default PricingPlansModal;
