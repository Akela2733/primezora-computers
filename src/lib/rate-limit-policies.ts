export const RATE_LIMIT_POLICIES = {
  customerLoginIp: { limit: 20, window: "15 m" },
  customerLoginAccount: { limit: 5, window: "15 m" },
  customerRegistrationIp: { limit: 5, window: "1 h" },
  customerRegistrationAccount: { limit: 3, window: "1 d" },
  customerEmailConfirmationIp: { limit: 10, window: "1 h" },
  customerEmailConfirmationAccount: { limit: 3, window: "1 d" },
  adminLoginIp: { limit: 10, window: "15 m" },
  adminLoginAccount: { limit: 5, window: "15 m" },
  checkoutCustomer: { limit: 10, window: "10 m" },
  checkoutIp: { limit: 30, window: "10 m" },
  publicCatalogIp: { limit: 120, window: "1 m" },
  orderTrackingIp: { limit: 10, window: "15 m" },
  paymentVerificationIp: { limit: 30, window: "15 m" },
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;
