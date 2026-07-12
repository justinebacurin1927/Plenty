package expo.modules.plentywidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * Plenty home screen widget — shows today's hydration progress.
 * Tapping the widget opens the Plenty app.
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

            val progressTextId = context.resources.getIdentifier("widget_progress_text", "id", pkg)
            val glassesTextId = context.resources.getIdentifier("widget_glasses_text", "id", pkg)
            val streakTextId = context.resources.getIdentifier("widget_streak_text", "id", pkg)
            val progressBarId = context.resources.getIdentifier("widget_progress_bar", "id", pkg)
            val rootId = context.resources.getIdentifier("widget_root", "id", pkg)

            if (progressTextId != 0) views.setTextViewText(progressTextId, "${currentMl}ml / ${goalMl}ml")
            if (glassesTextId != 0) views.setTextViewText(glassesTextId, "${count} glasses")
            if (streakTextId != 0) views.setTextViewText(streakTextId, if (streak > 0) "$streak day streak" else "")

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
