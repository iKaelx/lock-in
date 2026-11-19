export const appConfig = {
  adsEnabled: import.meta.env.VITE_ADS_ENABLED === 'true',
  adsenseClientId: import.meta.env.VITE_ADSENSE_CLIENT_ID ?? '',
  paymentEnabled: import.meta.env.VITE_PAYMENT_ENABLED === 'true',
  paymentProvider: import.meta.env.VITE_PAYMENT_PROVIDER ?? '',
  premiumFeaturesEnabled: import.meta.env.VITE_PREMIUM_FEATURES_ENABLED === 'true',
}
