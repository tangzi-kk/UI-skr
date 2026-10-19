package com.yearcalendar.k80;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.HeartRateRecord;
import android.health.connect.datatypes.StepsRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

/**
 * Small native bridge. Requires Android 14+ system Health Connect and user consent.
 * NEVER reads NFC payment/transport card contents or attempts Xiaomi private APIs.
 * Data is read only on explicit user action. The UI must not infer unavailable data as 0.
 */
public final class HealthConnectBridge {
    private static final ExecutorService UPLOADER = Executors.newSingleThreadExecutor();
    private static final String STEPS_PERMISSION = "android.permission.health.READ_STEPS";
    private static final String HEART_PERMISSION = "android.permission.health.READ_HEART_RATE";
    private final Activity activity;
    private final WebView webView;

    public HealthConnectBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    private void deliver(String method, JSONObject result) {
        activity.runOnUiThread(() -> {
            // JSONObject.toString is a JSON literal, safe to inject as a function argument.
            webView.evaluateJavascript("window.PolarisHealth && window.PolarisHealth." + method
                + "(" + result.toString() + ")", null);
        });
    }

    private JSONObject response(boolean ok, String message) {
        JSONObject r = new JSONObject();
        try { r.put("ok", ok); r.put("message", message); }
        catch (Exception ignored) {}
        return r;
    }

    @JavascriptInterface public void requestPermissions() {
        if (Build.VERSION.SDK_INT < 34) {
            deliver("onNativeResult", response(false, "此版本先支持 Android 14 及以上的系统 Health Connect"));
            return;
        }
        activity.runOnUiThread(() -> activity.requestPermissions(
            new String[]{ STEPS_PERMISSION, HEART_PERMISSION }, 1107
        ));
    }

    @JavascriptInterface public void readYesterday() {
        if (Build.VERSION.SDK_INT < 34) {
            deliver("onNativeResult", response(false, "需要 Android 14+ 的系统 Health Connect"));
            return;
        }
        activity.runOnUiThread(() -> {
            if (activity.checkSelfPermission(STEPS_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                deliver("onNativeResult", response(false, "请先授权 Health Connect 读取步数"));
                return;
            }
            final HealthConnectManager manager = activity.getSystemService(HealthConnectManager.class);
            if (manager == null) {
                deliver("onNativeResult", response(false, "当前系统 Health Connect 不可用"));
                return;
            }

            final LocalDate yesterday = LocalDate.now().minusDays(1);
            final ZonedDateTime start = yesterday.atStartOfDay(ZoneId.systemDefault());
            final ZonedDateTime end = yesterday.plusDays(1).atStartOfDay(ZoneId.systemDefault());
            final TimeInstantRangeFilter window = new TimeInstantRangeFilter.Builder()
                .setStartTime(start.toInstant()).setEndTime(end.toInstant()).build();
            final JSONObject data = new JSONObject();
            try {
                data.put("date", yesterday.toString());
                data.put("source", "health_connect");
            } catch (Exception ignored) {}

            final boolean readHeart = activity.checkSelfPermission(HEART_PERMISSION) == PackageManager.PERMISSION_GRANTED;
            final int expected = readHeart ? 2 : 1;
            final int[] completed = {0};
            final boolean[] hasMetrics = {false};
            final String[] problems = {""};
            Runnable complete = () -> {
                completed[0]++;
                if (completed[0] < expected) return;
                if (!hasMetrics[0]) {
                    deliver("onNativeResult", response(false, "没有找到昨日健康样本，请检查小米运动健康是否写入 Health Connect。" + problems[0]));
                    return;
                }
                try { data.put("ok", true); } catch (Exception ignored) {}
                deliver("onNativeResult", data);
            };

            try {
                AggregateRecordsRequest<Long> steps = new AggregateRecordsRequest.Builder<Long>(window)
                    .addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build();
                manager.aggregate(steps, activity.getMainExecutor(),
                    new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                        @Override public void onResult(AggregateRecordsResponse<Long> result) {
                            Long count = result.get(StepsRecord.STEPS_COUNT_TOTAL);
                            if (count != null) {
                                try { data.put("steps", count); hasMetrics[0] = true; } catch (Exception ignored) {}
                            }
                            complete.run();
                        }
                        @Override public void onError(HealthConnectException error) {
                            problems[0] = "（步数读取失败）";
                            complete.run();
                        }
                    });
            } catch (Exception ex) {
                problems[0] = "（步数读取失败）";
                complete.run();
            }
            if (readHeart) {
                try {
                    AggregateRecordsRequest<Long> heart = new AggregateRecordsRequest.Builder<Long>(window)
                        .addAggregationType(HeartRateRecord.BPM_AVG).build();
                    manager.aggregate(heart, activity.getMainExecutor(),
                        new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                            @Override public void onResult(AggregateRecordsResponse<Long> result) {
                                Long avg = result.get(HeartRateRecord.BPM_AVG);
                                if (avg != null) {
                                    try { data.put("avg_hr", avg); hasMetrics[0] = true; } catch (Exception ignored) {}
                                }
                                complete.run();
                            }
                            @Override public void onError(HealthConnectException error) { complete.run(); }
                        });
                } catch (Exception ex) { complete.run(); }
            }
        });
    }

    /**
     * Upload ONLY to a chosen HTTPS endpoint or RFC1918 LAN Mac relay.
     * Never accept arbitrary credential-bearing HTTP destinations.
     */
    @JavascriptInterface public void uploadDaily(String json, String endpoint, String token) {
        UPLOADER.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(endpoint);
                String host = url.getHost();
                boolean local = host.matches("192\\.168\\.\\d{1,3}\\.\\d{1,3}")
                    || host.matches("10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}")
                    || host.matches("172\\.(1[6-9]|2[0-9]|3[01])\\.\\d{1,3}\\.\\d{1,3}");
                if (!url.getPath().equals("/api/health/daily")
                    || !(url.getProtocol().equals("https") || (url.getProtocol().equals("http") && local))) {
                    throw new IllegalArgumentException("只允许 HTTPS 或可信局域网 Mac 健康接口");
                }
                if (token == null || token.length() < 12) throw new IllegalArgumentException("请输入 Mac 的健康同步令牌");
                JSONObject payload = new JSONObject(json);
                if (!payload.has("date")) throw new IllegalArgumentException("缺少日期");
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(7000);
                connection.setReadTimeout(15000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Authorization", "Bearer " + token);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream out = connection.getOutputStream()) {
                    out.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                }
                int status = connection.getResponseCode();
                JSONObject result;
                try (InputStream stream = status >= 200 && status < 300
                    ? connection.getInputStream() : connection.getErrorStream()) {
                    if (stream != null) {
                        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                        byte[] chunk = new byte[1024];
                        int n;
                        while ((n = stream.read(chunk)) >= 0 && buffer.size() < 16384) buffer.write(chunk, 0, n);
                        result = new JSONObject(buffer.toString("UTF-8"));
                    } else {
                        result = response(false, "Mac 健康接口 HTTP " + status);
                    }
                } catch (Exception parseError) {
                    result = response(false, "无法解析 Mac 健康接口返回数据");
                }
                try {
                    if (result.optBoolean("ok") && !result.optBoolean("feishu_synced")) {
                        result.put("message", "已保存到 Mac，但飞书尚未配置或尚未确认接收");
                    } else if (result.optBoolean("feishu_synced")) {
                        result.put("message", "飞书 Webhook 已接收；请在工作流日志确认写入");
                    }
                } catch (Exception ignored) {}
                deliver("onUploadResult", result);
            } catch (Exception error) {
                deliver("onUploadResult", response(false, "同步失败：" + error.getMessage()));
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }
}
