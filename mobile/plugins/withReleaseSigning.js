const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Signs release builds with the keystore named by FB_KEYSTORE_PATH, FB_KEYSTORE_PASSWORD,
 * FB_KEY_ALIAS and FB_KEY_PASSWORD. The prebuild default is the public debug key, which must not
 * sign an app people install. Without them the release task fails on the missing keystore instead of falling back to debug.
 */
const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes('FB_KEYSTORE_PATH')) return mod;

    const release = `
        release {
            if (System.getenv("FB_KEYSTORE_PATH")) {
                storeFile file(System.getenv("FB_KEYSTORE_PATH"))
                storePassword System.getenv("FB_KEYSTORE_PASSWORD")
                keyAlias System.getenv("FB_KEY_ALIAS")
                keyPassword System.getenv("FB_KEY_PASSWORD")
            }
        }`;
    gradle = gradle.replace(/(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n\s{8}\})/, `$1${release}`);
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release',
    );
    mod.modResults.contents = gradle;
    return mod;
  });

module.exports = withReleaseSigning;
