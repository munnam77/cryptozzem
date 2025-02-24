module.exports = {
  name: 'CryptoSignalZzem',
  displayName: 'CryptoSignal Zzem',
  expo: {
    name: 'CryptoSignal Zzem',
    slug: 'cryptosignal-zzem',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    splash: {
      image: './src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1E293B'
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.cryptosignalzzem.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/adaptive-icon.png',
        backgroundColor: '#1E293B'
      },
      package: 'com.cryptosignalzzem.app'
    },
    plugins: [
      'expo-notifications',
      [
        'expo-screen-orientation',
        {
          initialOrientation: 'PORTRAIT'
        }
      ]
    ],
    extra: {
      eas: {
        projectId: 'your-project-id'
      }
    }
  }
};