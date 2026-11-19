export type Entitlements = {
  plan: 'free'
  advancedAnalytics: false
  unlimitedPlans: false
  premiumTemplates: false
}

export function getEntitlements(): Entitlements {
  return { plan: 'free', advancedAnalytics: false, unlimitedPlans: false, premiumTemplates: false }
}
