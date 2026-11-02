const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const MODEL = 'mobilefacenet.tflite';

/**
 * Copies the face model into the Android project's native assets, where ModelAsset can find it.
 * Metro's asset path does not work for this file: in release builds it resolves to a bare
 * resource name, which the TFLite loader cannot open.
 */
const withModelAsset = (config) =>
  withDangerousMod(config, [
    'android',
    (mod) => {
      const source = path.join(mod.modRequest.projectRoot, 'assets', 'models', MODEL);
      if (!fs.existsSync(source)) {
        throw new Error(`Face model missing at ${source}. Run scripts/fetch-model.sh first.`);
      }
      const dir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(source, path.join(dir, MODEL));
      return mod;
    },
  ]);

module.exports = withModelAsset;
