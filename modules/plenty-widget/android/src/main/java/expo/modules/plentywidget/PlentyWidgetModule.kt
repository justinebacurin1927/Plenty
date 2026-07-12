package expo.modules.plentywidget

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module exposing widget update methods to JavaScript.
 * JS calls refreshWidget(data) after every drink log to push
 * fresh data to SharedPreferences and trigger a widget update.
 */
class PlentyWidgetModule : Module() {

    override fun definition() = ModuleDefinition {

        Name("PlentyWidget")

        // ── Update widget data and refresh ──
        // Called from JS: NativeModules.PlentyWidget.refreshWidget({ currentMl, goalMl, streak, glassesCount })
        Function("refreshWidget") { data: Map<String, Any> ->
            val context = appContext.reactContext ?: return@Function

            // Write to SharedPreferences
            val prefs = context.getSharedPreferences("plenty_widget", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putInt("current_ml", (data["currentMl"] as? Number)?.toInt() ?: 0)
                putInt("goal_ml", (data["goalMl"] as? Number)?.toInt() ?: 2000)
                putInt("streak", (data["streak"] as? Number)?.toInt() ?: 0)
                putInt("glasses_count", (data["glassesCount"] as? Number)?.toInt() ?: 0)
                apply()
            }

            // Broadcast widget update
            val intent = Intent(PlentyAppWidget.ACTION_UPDATE_WIDGET).apply {
                `package` = context.packageName
            }
            context.sendBroadcast(intent)

            return@Function true
        }
    }
}
