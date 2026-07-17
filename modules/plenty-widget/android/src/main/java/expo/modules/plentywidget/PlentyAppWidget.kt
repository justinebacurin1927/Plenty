package expo.modules.plentywidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.widget.RemoteViews

/**
 * Plenty home screen widget — shows today's hydration progress and streak.
 * Tapping the widget opens the Plenty app.
 * Supports dark mode via UiModeManager detection.
 */
class PlentyAppWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {}
    override fun onDisabled(context: Context) {}

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (ACTION_UPDATE_WIDGET == intent.action) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, PlentyAppWidget::class.java)
            )
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        const val ACTION_UPDATE_WIDGET = "expo.modules.plentywidget.UPDATE_WIDGET"
        private const val MUTED = "#6B8CAB"
        private const val MUTED_DARK = "#8A9BB5"
        private const val INK_PRIMARY = "#1A3A5C"
        private const val INK_PRIMARY_DARK = "#E0EAFF"
        private const val BRAND = "#4A90D9"
        private const val BRAND_DARK = "#6BB5FF"
        private const val AMBER = "#E67E22"
        private const val AMBER_DARK = "#F0A050"
        private const val SURFACE_BASE = "#E8F4FD"
        private const val SURFACE_RAISED = "#FFFFFF"
        private const val SURFACE_RAISED_DARK = "#1B2838"

        fun isDarkMode(context: Context): Boolean {
            return (context.resources.configuration.uiMode and
                    Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        }

        fun formatWidgetStreak(streak: Int): String {
            return if (streak > 0) "🔥 $streak day streak" else "🔥 Start tracking!"
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val pkg = context.packageName
            val layoutId = context.resources.getIdentifier("plenty_widget", "layout", pkg)
            if (layoutId == 0) return

            val views = RemoteViews(pkg, layoutId)

            val prefs = context.getSharedPreferences("plenty_widget", Context.MODE_PRIVATE)
            val currentMl = prefs.getInt("current_ml", 0)
            val goalMl = prefs.getInt("goal_ml", 2000)
            val streak = prefs.getInt("streak", 0)
            val count = prefs.getInt("glasses_count", 0)

            // Dark mode colors
            val dark = isDarkMode(context)
            val bgColor = if (dark) SURFACE_RAISED_DARK else SURFACE_RAISED
            val inkPrimary = if (dark) INK_PRIMARY_DARK else INK_PRIMARY
            val brandColor = if (dark) BRAND_DARK else BRAND
            val amberColor = if (dark) AMBER_DARK else AMBER
            val mutedColor = if (dark) MUTED_DARK else MUTED

            // Resource IDs
            val rootId = context.resources.getIdentifier("widget_root", "id", pkg)
            val streakTextId = context.resources.getIdentifier("widget_streak_text", "id", pkg)
            val progressTextId = context.resources.getIdentifier("widget_progress_text", "id", pkg)
            val glassesTextId = context.resources.getIdentifier("widget_glasses_text", "id", pkg)
            val progressBarId = context.resources.getIdentifier("widget_progress_bar", "id", pkg)
            val titleTextId = context.resources.getIdentifier("widget_title_text", "id", pkg)

            // Set background
            if (rootId != 0) {
                try {
                    views.setInt(rootId, "setBackgroundColor", Color.parseColor(bgColor))
                } catch (_: Exception) {}
            }

            // Streak text — prominent, amber colored
            if (streakTextId != 0) {
                val streakText = formatWidgetStreak(streak)
                views.setTextViewText(streakTextId, streakText)
                try {
                    views.setInt(streakTextId, "setTextColor", Color.parseColor(amberColor))
                } catch (_: Exception) {}
            }

            // Title color
            if (titleTextId != 0) {
                try {
                    views.setInt(titleTextId, "setTextColor", Color.parseColor(inkPrimary))
                } catch (_: Exception) {}
            }

            // Progress text
            if (progressTextId != 0) {
                views.setTextViewText(progressTextId, "${currentMl}ml / ${goalMl}ml")
                try {
                    views.setInt(progressTextId, "setTextColor", Color.parseColor(brandColor))
                } catch (_: Exception) {}
            }

            // Glasses count
            if (glassesTextId != 0) {
                views.setTextViewText(glassesTextId, "$count glasses")
                try {
                    views.setInt(glassesTextId, "setTextColor", Color.parseColor(mutedColor))
                } catch (_: Exception) {}
            }

            // Progress bar
            if (progressBarId != 0) {
                val pct = if (goalMl > 0) ((currentMl.toFloat() / goalMl.toFloat()) * 100).toInt().coerceIn(0, 100) else 0
                views.setProgressBar(progressBarId, 100, pct, false)
            }

            // Tap opens app
            val openIntent = context.packageManager.getLaunchIntentForPackage(pkg)
            if (openIntent != null && rootId != 0) {
                views.setOnClickPendingIntent(rootId, PendingIntent.getActivity(
                    context, 0, openIntent,
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                ))
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
