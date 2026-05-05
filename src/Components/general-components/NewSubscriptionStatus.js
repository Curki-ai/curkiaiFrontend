import { useEffect } from "react";
import { checkSubscriptionStatus } from "./getSubscription";

const useSubscriptionStatus = (
  user,
  setShowPricingModal,
  setSubscriptionInfo
) => {

  useEffect(() => {
    if (!user?.email) return;

    const bypassDomains = [
      "curki.ai",
      "caringways.com.au",
      "tenderlovingcaredisability.com.au",
      "tenderlovingcare.com.au",
      "allaboutcaring.com.au",
      "youcareds.com",
      "contemporarycoordination.com",
      "careait.com"
    ];

    const emailDomain = user.email.split("@")[1]?.toLowerCase();

    if (bypassDomains.includes(emailDomain)) {
      setShowPricingModal(false);
      setSubscriptionInfo(null);
      return;
    }

    const runCheck = async () => {
      const result = await checkSubscriptionStatus(user.email);

      setShowPricingModal(result.shouldShowPricing);
      setSubscriptionInfo(result.subscription || null);
    };

    runCheck();

  }, [user, setShowPricingModal, setSubscriptionInfo]);
};

export default useSubscriptionStatus;