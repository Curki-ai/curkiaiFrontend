import React, { useState } from "react";
import "../Styles/NewPricingModal.css";
import { IoClose } from "react-icons/io5";
import pricingTick from "../Images/pricingmodaltick.png"
import ComparePlans from "./ComparePlans";
import pricingExampleIcon from "../Images/PricingExampleIcon.svg"
import pricingTooltip from "../Images/pricingTooltipIcon.svg"
const PricingPlansModal = ({ onClose, email: userEmail, firstName: firstName, setSubscriptionInfo }) => {
    console.log("User Email:", userEmail); // For debugging
    const [billing, setBilling] = useState("monthly");
    const [showCompare, setShowCompare] = useState(false);


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
                {/* <div className="pricing-top">
                    <div></div>
                    <button className="pricing-close" onClick={onClose}>
                        <IoClose size={22} />
                    </button>
                </div> */}

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
                        title="Start"
                        subtitle="For teams up to 50 staff"
                        planKey="start"
                        monthly={99}
                        yearly={950}
                        yearlyMonthly={89}
                        billing={billing}
                        features={[
                            "4M AI tokens",
                            "100 SMS",
                            "~25 clicks",
                            "$50 auto top-up when tokens or SMS run out",
                        ]}
                        saving="$100K+ / year"
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Grow"
                        badge="Popular"
                        subtitle="For teams with 50–100 staff"
                        planKey="grow"
                        monthly={399}
                        yearly={3830}
                        yearlyMonthly={299}
                        billing={billing}
                        features={[
                            "15M AI tokens",
                            "1,000 SMS",
                            "~100 clicks",
                            "$50 auto top-up when tokens or SMS run out",
                        ]}
                        saving="$100,000+ / year"
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Thrive"
                        badge="Value"
                        highlighted
                        subtitle="For teams with 100+ staff"
                        planKey="growth"
                        monthly={999}
                        yearly={9590}
                        yearlyMonthly={799}
                        billing={billing}
                        popular
                        features={[
                            "50M AI tokens",
                            "3,000 SMS",
                            "~300 clicks",
                            "$50 auto top-up when tokens or SMS run out",
                        ]}
                        saving="$200,000+ / year"
                        onCompare={() => setShowCompare(true)}
                        onCheckout={handleCheckout}
                        userEmail={userEmail}
                        onClose={onClose}
                        firstName={firstName}
                        setSubscriptionInfo={setSubscriptionInfo}
                    />

                    <Plan
                        title="Command"
                        subtitle="For teams with 200+ staff"
                        planKey="command"
                        payg
                        features={[
                            "Unlimited tokens",
                            "Unlimited SMS",
                            "Unlimited actions",
                            "NA",
                        ]}
                        saving="$1.2M+ / year"
                        onCompare={() => setShowCompare(true)}
                    />

                </div>
                {/* Standard Features */}
                <div className="standard-features">
                    <div className="standard-left">
                        <h3>
                            <p>Standard Features Across</p>
                            <p>All Plans</p>
                        </h3>
                    </div>

                    <div className="standard-right">
                        <div className="standard-column">
                            <h4>Aged Care / NDIS</h4>
                            <ul>
                                <li><img src={pricingTick} /> Financial Health</li>
                                <li><img src={pricingTick} /> Client Profitability</li>
                                <li><img src={pricingTick} /> Payroll Analysis</li>
                            </ul>
                        </div>

                        <div className="standard-column">
                            <h4>Automation</h4>
                            <ul>
                                <li><img src={pricingTick} /> Smart Rostering</li>
                                <li><img src={pricingTick} /> Smart Onboarding</li>
                                <li><img src={pricingTick} /> CareVoice (Voice → Document)</li>
                            </ul>
                        </div>

                        <div className="standard-column">
                            <h4>NDIS</h4>
                            <ul>
                                <li><img src={pricingTick} /> Incident Auditing</li>
                                <li><img src={pricingTick} /> Event & Incident Management</li>
                            </ul>
                        </div>
                    </div>
                </div>
                {/* Example usage */}
                <div className="pricing-example">
                    <img src={pricingExampleIcon} alt="example" />
                    <span>
                        <strong>Example:</strong> One Rostering / Voice To Document / Onboarding Click ≈
                        150k tokens
                    </span>
                </div>

                {/* Enterprise */}
                {/* <div className="enterprise">
                    <div className="enterprise-content">
                        <h3 className="enterprise-title">
                            Standard Features Across
                            <br />
                            All Plans
                        </h3>

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
                </div> */}
                {/* {showCompare && (
                    <ComparePlans />
                )} */}

            </div>
        </div>
    );
};

const Plan = ({ title,
    subtitle,
    planKey,
    monthly,
    yearly,
    yearlyMonthly,
    billing,
    features,
    popular,
    saving,
    payg,
    onCompare,
    onCheckout,
    userEmail,
    onClose,
    firstName,
    setSubscriptionInfo, highlighted, badge }) => {
    const price = billing === "monthly" ? monthly : yearly;
    const formatPrice = (value) => {
        if (!value) return value;
        return value.toLocaleString("en-US");
    };
    const startTrial = async () => {
        try {
            // 1️⃣ Start trial in your system
            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/subscription/start-trial",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: userEmail, firstName: firstName }),
                }
            );

            if (!res.ok) {
                console.error("Trial start failed");
                return;
            }
            const data = await res.json();
            console.log("Trial started:", data);
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
            className={`plan-card ${highlighted ? "popular" : ""}`}
        >
            {badge && (
                <span
                    className={`plan-badge ${badge === "Value" ? "value-badge" : "popular-badge"
                        }`}
                >
                    {badge}
                </span>
            )}
            <div style={{ height: "100px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: billing === "yearly" ? "24px" : "0px" }}>
                <div className="plan-header">
                    <div>
                        <h4>{title}</h4>
                        {subtitle && (
                            <p style={{ fontSize: "14px", color: "#707493", lineHeight: "24px" }}>{subtitle}</p>
                        )}
                    </div>
                </div>


                <div className="price">
                    {payg ? (
                        <>
                            <span className="price-amount">PAYG</span>
                            <span className="price-duration">(Pay As You Go)</span>
                        </>
                    ) : billing === "yearly" ? (
                        <div style={{ textAlign: "left" }}>
                            <div>
                                <span className="price-currency">$</span>
                                <span className="price-amount">{yearlyMonthly}</span>
                                <span className="price-duration">/month</span>
                            </div>

                            {/* small yearly price under */}
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#707493",
                                    marginBottom: "4px"
                                }}
                            >
                                ${formatPrice(yearly)}/year
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="price-currency">$</span>
                            <span className="price-amount">{monthly}</span>
                            <span className="price-duration">/month</span>
                        </>
                    )}
                </div>
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
                {saving && (
                    <div className="saving-badge-container" >
                        <div className="saving-badge">
                            Indicative provider saving {saving}
                        </div>

                        <div className="example-usage">
                            Example of usage
                            <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img src={pricingTooltip}></img>
                            </div>
                            <div className="tooltip">
                                Covers 5 Report + 10 Rostering / Voice To Text Documents / Onboarding
                            </div>
                        </div>
                    </div>
                )}
            </ul>



            <div className="plan-actions">

                {title === "Command" ? (
                    /* Only Contact Sales */
                    <button
                        className="contact-sales-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "mailto:sarah@curki.ai";
                        }}
                    >
                        Contact Sales
                    </button>
                ) : (
                    <>
                        {/* Buy Now */}
                        <button
                            className={
                                popular
                                    ? "primary-btn popular-btn"
                                    : "primary-btn outline-plan-btn"
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                onCheckout({ planKey });
                            }}
                        >
                            Buy Now
                        </button>

                        {/* Trial */}
                        <button
                            className="trial-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                startTrial();
                            }}
                        >
                            Start 15-day free trial
                        </button>
                    </>
                )}

            </div>


        </div>
    );
};

export default PricingPlansModal;
