const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo config plugin that registers the Plenty home screen widget
 * receiver in AndroidManifest.xml.
 */
function withPlentyWidget(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const androidManifest = manifestConfig.modResults;

    // Ensure manifest element exists
    if (!androidManifest.manifest?.application?.[0]) {
      return manifestConfig;
    }

    const application = androidManifest.manifest.application[0];

    // Avoid duplicate receiver entries
    if (application.receiver) {
      const hasReceiver = application.receiver.some(
        (r) => r.$["android:name"] === "expo.modules.plentywidget.PlentyAppWidget"
      );
      if (hasReceiver) return manifestConfig;
    } else {
      application.receiver = [];
    }

    // Add the AppWidget provider receiver
    application.receiver.push({
      $: {
        "android:name": "expo.modules.plentywidget.PlentyAppWidget",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name": "android.appwidget.action.APPWIDGET_UPDATE",
              },
            },
          ],
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.appwidget.provider",
            "android:resource": "@xml/plenty_widget_info",
          },
        },
      ],
    });

    return manifestConfig;
  });
}

module.exports = withPlentyWidget;
