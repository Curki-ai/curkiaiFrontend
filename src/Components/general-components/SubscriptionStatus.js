import { getDatabase, ref, get, update } from "firebase/database";
import { useEffect } from "react";

const SubscriptionStatus = (user, setShowPricingModal) => {
  useEffect(() => {
    if (!user) return;

    // ✅ Only check subscription for this email
    if (user?.email === "noah@caringways.com.au" || user?.email === "utkarsh@curki.ai" || user?.email === "kris@curki.ai" || user?.email === "gjavier@tenderlovingcaredisability.com.au" || user?.email === "kaylyn@allaboutcaring.com.au") {
      setShowPricingModal(false);
      return;
    }

    const db = getDatabase();
    const paymentRef = ref(db, `users/${user.uid}/paymentInfo`);

    const now = new Date();

    const fallbackToCreationTimeCheck = () => {
      const creationDate = new Date(user?.metadata?.creationTime);
      const daysSinceCreation = (now - creationDate) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 30) {
        setShowPricingModal(true);
      } else {
        setShowPricingModal(false);
      }
    };

    get(paymentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const { paymentStatus, paymentTime } = data;

          if (paymentStatus === "paid" && paymentTime) {
            const paymentDate = new Date(paymentTime);
            const daysSincePayment =
              (now - paymentDate) / (1000 * 60 * 60 * 24);

            if (daysSincePayment > 30) {
              // Show modal and update status in Firebase
              setShowPricingModal(true);
              update(paymentRef, { paymentStatus: "not paid" });
            } else {
              setShowPricingModal(false); // ✅ Hide modal if still within subscription
            }
          } else {
            fallbackToCreationTimeCheck();
          }
        } else {
          fallbackToCreationTimeCheck();
        }
      })
      .catch((err) => {
        console.error("Error fetching paymentInfo:", err);
        fallbackToCreationTimeCheck();
      });
  }, [user, setShowPricingModal]);
};

export default SubscriptionStatus;
