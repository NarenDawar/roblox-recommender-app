import { getAuth } from 'firebase/auth';
import { getStripe } from '../../utils/stripe';

const CheckoutButton = ({ priceId, plan }) => {

  const handleCheckout = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("User is not logged in.");
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ priceId, plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId });

    } catch (error) {
      console.error("Error handling checkout:", error);
    }
  };

  return (
    <button onClick={handleCheckout}>
      {/* FIX: Text is now dynamic based on the plan prop */}
      Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </button>
  );
};

export default CheckoutButton;