const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidTTS = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        if (!androidManifest.manifest.queries) {
            androidManifest.manifest.queries = [];
        }

        // Add TTS query if not present
        const ttsIntent = {
            intent: [
                {
                    action: [
                        {
                            $: {
                                'android:name': 'android.intent.action.TTS_SERVICE',
                            },
                        },
                    ],
                },
            ],
        };

        // Check if already exists to avoid duplicates (basic check)
        const hasTTS = androidManifest.manifest.queries.some(q =>
            q.intent && q.intent.some(i =>
                i.action && i.action.some(a => a.$['android:name'] === 'android.intent.action.TTS_SERVICE')
            )
        );

        if (!hasTTS) {
            androidManifest.manifest.queries.push(ttsIntent);
        }

        return config;
    });
};

module.exports = withAndroidTTS;
