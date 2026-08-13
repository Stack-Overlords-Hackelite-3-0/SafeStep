package com.safestep.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

// Bridges the JS app to the native system-wide SOS bubble: permission
// checks, syncing the logged-in user's auth token/API base URL so the
// background service can fire an SOS without the app being open, and
// starting/stopping the overlay service itself.
@CapacitorPlugin(
    name = "SosOverlay",
    permissions = { @Permission(strings = { android.Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class SosOverlayPlugin extends Plugin {

    static final String PREFS_NAME = "sos_overlay_prefs";
    static final String PREF_TOKEN = "token";
    static final String PREF_BASE_URL = "base_url";
    static final String PREF_BUBBLE_ENABLED = "bubble_enabled";

    @PluginMethod
    public void hasOverlayPermission(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
        ret.put("value", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void hasNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            granted =
                ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.POST_NOTIFICATIONS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED;
        }
        ret.put("value", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionForAlias("notifications", call, "notificationPermCallback");
        } else {
            call.resolve();
        }
    }

    @PermissionCallback
    private void notificationPermCallback(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void setCredentials(PluginCall call) {
        String token = call.getString("token");
        String baseUrl = call.getString("baseUrl");
        SharedPreferences.Editor editor = prefs().edit();
        editor.putString(PREF_TOKEN, token);
        editor.putString(PREF_BASE_URL, baseUrl);
        editor.apply();
        call.resolve();
    }

    @PluginMethod
    public void clearCredentials(PluginCall call) {
        SharedPreferences.Editor editor = prefs().edit();
        editor.remove(PREF_TOKEN);
        editor.apply();
        // Also turn off the bubble — it can't do anything useful signed out.
        stopBubbleInternal();
        call.resolve();
    }

    @PluginMethod
    public void startBubble(PluginCall call) {
        prefs().edit().putBoolean(PREF_BUBBLE_ENABLED, true).apply();
        Intent intent = new Intent(getContext(), SosOverlayService.class);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stopBubble(PluginCall call) {
        stopBubbleInternal();
        call.resolve();
    }

    private void stopBubbleInternal() {
        prefs().edit().putBoolean(PREF_BUBBLE_ENABLED, false).apply();
        getContext().stopService(new Intent(getContext(), SosOverlayService.class));
    }

    @PluginMethod
    public void isBubbleActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", SosOverlayService.isRunning);
        call.resolve(ret);
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
