const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'default'];

/** Bắt buộc NativeWind v4: bundle + biên dịch Tailwind từ global.css — thiếu bước này className admin/user dễ “bể” layout. */
module.exports = withNativeWind(config, { input: './global.css' });
