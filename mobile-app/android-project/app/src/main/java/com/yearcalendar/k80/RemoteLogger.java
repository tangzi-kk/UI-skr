package com.yearcalendar.k80;

import android.os.Build;
import android.util.Log;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RemoteLogger {

    private static final String SERVER_URL = "http://192.168.1.8:8089/log";
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    public static void i(String tag, String msg) {
        Log.i(tag, msg);
        send("[INFO] [" + tag + "] " + msg);
    }

    public static void w(String tag, String msg) {
        Log.w(tag, msg);
        send("[WARN] [" + tag + "] " + msg);
    }

    public static void e(String tag, String msg, Throwable t) {
        String err = msg + "\n" + Log.getStackTraceString(t);
        Log.e(tag, err);
        send("[ERROR] [" + tag + "] " + err);
    }

    public static void beacon(String event) {
        String device = "REDMI K80 (Android " + Build.VERSION.RELEASE + ", SDK " + Build.VERSION.SDK_INT + ", Model " + Build.MODEL + ")";
        send("[BEACON] " + event + " | Device: " + device);
    }

    private static void send(String payload) {
        EXECUTOR.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(SERVER_URL);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(2000);
                conn.setReadTimeout(2000);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "text/plain; charset=utf-8");

                byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(bytes);
                    os.flush();
                }
                conn.getResponseCode();
            } catch (Throwable ignored) {
                // 网络失败不影响主应用
            } finally {
                if (conn != null) {
                    try { conn.disconnect(); } catch (Throwable ignored) {}
                }
            }
        });
    }
}
