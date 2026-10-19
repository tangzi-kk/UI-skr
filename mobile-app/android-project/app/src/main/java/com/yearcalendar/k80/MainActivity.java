package com.yearcalendar.k80;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.ScrollView;

public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    private WebView mWebView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. 发射第一道存活心跳 (Beacon)
        RemoteLogger.beacon("MainActivity.onCreate Started");

        // 2. 注入全局未捕获异常遥测
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            RemoteLogger.e("FATAL_UNCAUGHT", "Uncaught exception on thread: " + thread.getName(), throwable);
            runOnUiThread(() -> showErrorScreen(throwable));
        });

        super.onCreate(savedInstanceState);

        try {
            // 3. 配置透明沉浸式系统栏
            setupSystemBars();

            // 4. 初始化全屏 WebView
            setupWebView();

            RemoteLogger.i(TAG, "MainActivity initialized successfully");
        } catch (Throwable t) {
            RemoteLogger.e(TAG, "Fatal exception in onCreate", t);
            showErrorScreen(t);
        }
    }

    private void setupSystemBars() {
        try {
            Window window = getWindow();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.setStatusBarColor(Color.TRANSPARENT);
                window.setNavigationBarColor(Color.TRANSPARENT);
            }

            View decorView = window.getDecorView();
            if (decorView != null) {
                decorView.post(() -> {
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            WindowInsetsController controller = decorView.getWindowInsetsController();
                            if (controller != null) {
                                controller.setSystemBarsAppearance(
                                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                                );
                            }
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            decorView.setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                            );
                        }
                        RemoteLogger.i(TAG, "Status bar insets configured");
                    } catch (Throwable ignored) {
                        RemoteLogger.w(TAG, "Status bar appearance exception: " + ignored.getMessage());
                    }
                });
            }
        } catch (Throwable t) {
            RemoteLogger.w(TAG, "System bars setup skipped: " + t.getMessage());
        }
    }

    private void setupWebView() {
        RemoteLogger.i(TAG, "Creating WebView...");
        mWebView = new WebView(this);
        // Bridge is only for explicit, user-authorized Health Connect reads.
        mWebView.addJavascriptInterface(new HealthConnectBridge(this, mWebView), "PolarisNativeHealth");
        setContentView(mWebView);
        RemoteLogger.i(TAG, "setContentView(mWebView) completed");

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        try {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        } catch (Throwable ignored) {}

        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                RemoteLogger.i(TAG, "WebView page finished: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                RemoteLogger.e(TAG, "WebView error: " + error.getDescription() + " code=" + error.getErrorCode(), new Exception("WebResourceError"));
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    try {
                        request.grant(request.getResources());
                        RemoteLogger.i(TAG, "Granted WebView permissions: " + java.util.Arrays.toString(request.getResources()));
                    } catch (Throwable t) {
                        RemoteLogger.w(TAG, "Failed granting permission: " + t.getMessage());
                    }
                });
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                RemoteLogger.i("JS_CONSOLE", consoleMessage.message() + " [" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + "]");
                return super.onConsoleMessage(consoleMessage);
            }
        });

        RemoteLogger.i(TAG, "Loading file:///android_asset/mobile-app.html");
        mWebView.loadUrl("file:///android_asset/mobile-app.html");
    }

    private void showErrorScreen(Throwable t) {
        try {
            ScrollView scrollView = new ScrollView(this);
            scrollView.setBackgroundColor(0xFF0F172A);
            scrollView.setPadding(40, 80, 40, 40);

            TextView textView = new TextView(this);
            textView.setTextColor(0xFFF87171);
            textView.setTextSize(13f);
            textView.setText("⚠️ 年度日历启动诊断报告（已同步至 Mac 终端）：\n\n" + Log.getStackTraceString(t));

            scrollView.addView(textView);
            setContentView(scrollView);
        } catch (Throwable ignored) {}
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
