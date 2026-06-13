import { API_BASE } from "../../config/apiBase";
import { auth } from "../../firebase";

const isBillingPeriodOver = (subscription) => {
    if (!subscription) return true;

    const now = new Date();

    // 🟡 TRIAL LOGIC
    if (subscription.subscription_type === "trial") {
        if (!subscription.trial_end) return true;
        const trialEnd = new Date(subscription.trial_end);
        return now > trialEnd;
    }

    // 🟢 PAID LOGIC (Stripe-managed period)
    if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end);
        return now > periodEnd;
    }

    // ⚠️ FALLBACK (should rarely happen)
    const createdAt = new Date(subscription.created_at);

    if (subscription.billing_interval === "monthly") {
        const expiry = new Date(createdAt);
        expiry.setMonth(expiry.getMonth() + 1);
        return now > expiry;
    }

    if (subscription.billing_interval === "yearly") {
        const expiry = new Date(createdAt);
        expiry.setFullYear(expiry.getFullYear() + 1);
        return now > expiry;
    }

    return true;
};

export const checkSubscriptionStatus = async (email) => {
    if (!email) return { shouldShowPricing: false };

    try {
        // Backend now reads identity from the verified Firebase token, not
        // the email query param. The email arg is kept for the early-exit
        // guard above (still useful as a caller-side sanity check).
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { shouldShowPricing: false };
        const res = await fetch(
            `${API_BASE}/api/subscription/getSubscription`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        // If subscription not found → DO NOT show pricing
        if (!data.ok || !data.subscription) {
            return { 
                shouldShowPricing: false,
                subscription: null
            };
        }

        const sub = data.subscription;

        // 🟡 TRIAL USER
        if (sub.subscription_type === "trial") {
            const trialExpired = isBillingPeriodOver(sub);
            return {
                shouldShowPricing: trialExpired,
                subscription: sub,
            };
        }

        // 🟢 PAID USER
        if (sub.subscription_type === "paid" && sub.status === "active") {
            const billingExpired = isBillingPeriodOver(sub);

            return {
                shouldShowPricing: billingExpired,
                subscription: sub
            };
        }

        // 🔴 Everything else → show pricing
        return {
            shouldShowPricing: true,
            subscription: sub
        };

    } catch (err) {
        console.error("Subscription check failed:", err);

        // network error → don't block user
        return { shouldShowPricing: false };
    }
};
