import { useEffect } from "react";
import { checkSubscriptionStatus } from "./getSubscription";


/**
 * NewSubscriptionStatus
 * Controls Pricing Modal + exposes subscription info
 */
const NewSubscriptionStatus = (
  user,
  setShowPricingModal,
  setSubscriptionInfo 
) => {
  useEffect(() => {
    if (!user?.email) return;

    // internal / admin bypass
    const bypassEmails = [
      "noah@caringways.com.au",
      "utkarsh@curki.ai",
      "kris@curki.ai",
      "gjavier@tenderlovingcaredisability.com.au",
      "kaylyn@allaboutcaring.com.au",
      "mtalukder@tenderlovingcaredisability.com.au",
      "bastruc@tenderlovingcare.com.au",
      "mfarag@tenderlovingcare.com.au",
      "yzaki@tenderlovingcare.com.au"
    ];

    if (bypassEmails.includes(user.email)) {
      setShowPricingModal(false);
      setSubscriptionInfo(null); // no trial badge
      return;
    }

    const runCheck = async () => {
      const result = await checkSubscriptionStatus(user.email);

      setShowPricingModal(result.shouldShowPricing);

      // ✅ expose subscription to HomePage
      if (result.subscription) {
        setSubscriptionInfo(result.subscription);
      } else {
        setSubscriptionInfo(null);
      }
    };

    runCheck();
  }, [user, setShowPricingModal, setSubscriptionInfo]);
};

export default NewSubscriptionStatus;


