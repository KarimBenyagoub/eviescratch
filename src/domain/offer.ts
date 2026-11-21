export const subscriptionOffer = {
  trialDays: 3,
  currency: 'USD',
  plans: {
    weekly: { label: 'Weekly', amount: 799, interval: 'week', display: '$7.99', cadence: 'per week' },
    annual: { label: 'Annual', amount: 29988, interval: 'year', display: '$299.88', cadence: 'per year' },
  },
} as const;
export type PlanId = keyof typeof subscriptionOffer.plans;
