import Stripe from "stripe";

const stripe = new Stripe(`${process.env.STRIPE_API_KEY}`);

export const GetPaymentLink = async (domain: string, username: string) => {
  const response = await stripe.paymentLinks.create({
    line_items: [
      {
        price: process.env.STRIPE_PLAN,
        quantity: 1,
      },
    ],
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${process.env.FRONTEND_BASE_URL}/import/checkout/{CHECKOUT_SESSION_ID}`,
      },
    },
    metadata: {
      domain: domain,
      username: username,
    },
  });
  return response;
};

export const GetCheckout = async (checkoutId: string) => {
  const response = await stripe.checkout.sessions.retrieve(checkoutId);
  return response;
};
