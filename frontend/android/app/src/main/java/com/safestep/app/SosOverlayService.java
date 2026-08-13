package com.safestep.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

// Renders the SafeStep SOS bubble over every other app (WhatsApp, home
// screen, lock screen, etc.) via WindowManager, and fires an SOS directly
// from here on tap — reading the token/API URL synced from the JS app and
// making the /api/sos/trigger call natively, with no UI needed. Runs as a
// foreground service because Android kills any background service that
// isn't one within seconds.
public class SosOverlayService extends Service {

    private static final String CHANNEL_ID = "sos_overlay_channel";
    private static final int NOTIFICATION_ID = 4210;
    private static final int TOUCH_SLOP_PX = 12;
    private static final long LOCATION_TIMEOUT_MS = 6000;
    private static final long HOLD_DURATION_MS = 1500;

    public static volatile boolean isRunning = false;

    private WindowManager windowManager;
    private ImageView bubbleView;
    private WindowManager.LayoutParams layoutParams;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundNotification();
        addBubble();
        isRunning = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        if (windowManager != null && bubbleView != null) {
            try {
                windowManager.removeView(bubbleView);
            } catch (IllegalArgumentException ignored) {
                // View was already detached — nothing to clean up.
            }
        }
    }

    private void startForegroundNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SafeStep SOS bubble",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the floating SOS button active over other apps.");
            nm.createNotificationChannel(channel);
        }

        Intent openApp = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = null;
        if (openApp != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
            contentIntent = PendingIntent.getActivity(this, 0, openApp, flags);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SafeStep protection is active")
            .setContentText("Tap the floating shield anywhere to send an SOS.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setContentIntent(contentIntent)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void addBubble() {
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        bubbleView = new ImageView(this);
        bubbleView.setImageResource(R.drawable.ic_sos_shield);
        bubbleView.setBackgroundResource(R.drawable.bg_sos_bubble);
        int pad = dp(14);
        bubbleView.setPadding(pad, pad, pad, pad);

        int size = dp(56);
        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        layoutParams = new WindowManager.LayoutParams(
            size,
            size,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        layoutParams.gravity = Gravity.TOP | Gravity.START;

        SharedPreferences prefs = prefs();
        DisplayMetrics dm = getResources().getDisplayMetrics();
        layoutParams.x = prefs.getInt("bubble_x", dm.widthPixels - size - dp(16));
        layoutParams.y = prefs.getInt("bubble_y", dm.heightPixels - size - dp(160));

        bubbleView.setOnTouchListener(new View.OnTouchListener() {
            private int startX, startY;
            private float startTouchX, startTouchY;
            private boolean moved;
            private boolean holdFired;
            private final Runnable holdRunnable = () -> {
                holdFired = true;
                fireSos();
            };

            private void cancelHold() {
                mainHandler.removeCallbacks(holdRunnable);
                bubbleView.animate().scaleX(1f).scaleY(1f).setDuration(120).start();
            }

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        startX = layoutParams.x;
                        startY = layoutParams.y;
                        startTouchX = event.getRawX();
                        startTouchY = event.getRawY();
                        moved = false;
                        holdFired = false;
                        // Hold-to-trigger, same as the in-app SOS button — a plain
                        // tap must not be able to fire a false alarm.
                        mainHandler.postDelayed(holdRunnable, HOLD_DURATION_MS);
                        bubbleView.animate().scaleX(1.2f).scaleY(1.2f).setDuration(HOLD_DURATION_MS).start();
                        return true;
                    case MotionEvent.ACTION_MOVE: {
                        float dx = event.getRawX() - startTouchX;
                        float dy = event.getRawY() - startTouchY;
                        if (!moved && Math.abs(dx) < TOUCH_SLOP_PX && Math.abs(dy) < TOUCH_SLOP_PX) {
                            return true;
                        }
                        if (!moved) {
                            // Movement past the threshold means this is a drag, not a
                            // hold-press — abandon the SOS countdown.
                            cancelHold();
                        }
                        moved = true;
                        layoutParams.x = startX + (int) dx;
                        layoutParams.y = startY + (int) dy;
                        try {
                            windowManager.updateViewLayout(bubbleView, layoutParams);
                        } catch (IllegalArgumentException ignored) {
                            // Service is mid-teardown — ignore stray touch events.
                        }
                        return true;
                    }
                    case MotionEvent.ACTION_UP:
                        prefs().edit().putInt("bubble_x", layoutParams.x).putInt("bubble_y", layoutParams.y).apply();
                        if (!holdFired) {
                            cancelHold();
                        }
                        return true;
                    default:
                        return false;
                }
            }
        });

        try {
            windowManager.addView(bubbleView, layoutParams);
        } catch (Exception e) {
            // Overlay permission not actually granted — stop ourselves rather
            // than run a foreground service with nothing to show for it.
            stopSelf();
        }
    }

    private void fireSos() {
        SharedPreferences prefs = prefs();
        String token = prefs.getString(SosOverlayPlugin.PREF_TOKEN, null);
        String baseUrl = prefs.getString(SosOverlayPlugin.PREF_BASE_URL, null);
        if (token == null || baseUrl == null) {
            toast("Log in to SafeStep first.");
            return;
        }
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            toast("Location permission is needed to send SOS.");
            return;
        }

        toast("Sending SOS…");
        getLocationThenSend(baseUrl, token);
    }

    private void getLocationThenSend(String baseUrl, String token) {
        LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Location best = null;
        try {
            for (String provider : new String[] { LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER }) {
                Location loc = lm.getLastKnownLocation(provider);
                if (loc != null && (best == null || loc.getTime() > best.getTime())) {
                    best = loc;
                }
            }
        } catch (SecurityException e) {
            toast("Location permission is needed to send SOS.");
            return;
        }

        // Fresh enough (under 5 min old) — use it immediately rather than
        // waiting on a new fix.
        if (best != null && System.currentTimeMillis() - best.getTime() < 5 * 60 * 1000) {
            sendSos(baseUrl, token, best.getLatitude(), best.getLongitude());
            return;
        }

        requestFreshLocation(lm, baseUrl, token, best);
    }

    private void requestFreshLocation(LocationManager lm, String baseUrl, String token, Location fallback) {
        final boolean[] responded = { false };
        String provider = lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
            ? LocationManager.GPS_PROVIDER
            : LocationManager.NETWORK_PROVIDER;

        LocationListener listener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (responded[0]) return;
                responded[0] = true;
                lm.removeUpdates(this);
                sendSos(baseUrl, token, location.getLatitude(), location.getLongitude());
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {}

            @Override
            public void onProviderEnabled(String provider) {}

            @Override
            public void onProviderDisabled(String provider) {}
        };

        try {
            lm.requestSingleUpdate(provider, listener, Looper.getMainLooper());
        } catch (SecurityException e) {
            toast("Location permission is needed to send SOS.");
            return;
        }

        mainHandler.postDelayed(() -> {
            if (responded[0]) return;
            responded[0] = true;
            lm.removeUpdates(listener);
            if (fallback != null) {
                sendSos(baseUrl, token, fallback.getLatitude(), fallback.getLongitude());
            } else {
                toast("Could not get your location. Open the app to send SOS instead.");
            }
        }, LOCATION_TIMEOUT_MS);
    }

    private void sendSos(String baseUrl, String token, double latitude, double longitude) {
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("latitude", latitude);
                body.put("longitude", longitude);
                body.put("notify_police", false);

                URL url = new URL(baseUrl + "/api/sos/trigger");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    mainHandler.post(() -> {
                        toast("SOS sent — your trusted contacts have been notified.");
                        vibrate();
                    });
                } else {
                    String errorBody = readStream(conn.getErrorStream());
                    mainHandler.post(() -> toast("Could not send SOS (server error " + code + ")."));
                }
            } catch (Exception e) {
                mainHandler.post(() -> toast("Could not send SOS — check your connection."));
            }
        }).start();
    }

    private String readStream(java.io.InputStream is) {
        if (is == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void vibrate() {
        Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(300);
        }
    }

    private void toast(String message) {
        mainHandler.post(() -> Toast.makeText(SosOverlayService.this, message, Toast.LENGTH_LONG).show());
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(SosOverlayPlugin.PREFS_NAME, Context.MODE_PRIVATE);
    }
}
