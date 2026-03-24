/**
 * Expo config - merge app.json với biến môi trường (Google Maps API key)
 * Thêm EXPO_PUBLIC_GOOGLE_MAPS_API_KEY vào .env để dùng Google Maps trên Android
 */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config ?? {}),
        ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && {
          googleMaps: {
            apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        }),
      },
    },
  },
};
