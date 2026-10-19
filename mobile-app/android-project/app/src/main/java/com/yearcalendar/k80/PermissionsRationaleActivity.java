package com.yearcalendar.k80;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.widget.ScrollView;
import android.widget.TextView;

/** Health Connect permission disclosure shown from system privacy settings. */
public final class PermissionsRationaleActivity extends Activity {
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(0xFFF6F5EF);
        TextView text = new TextView(this);
        text.setTextColor(0xFF24362A);
        text.setTextSize(17f);
        text.setPadding(42, 66, 42, 48);
        text.setText("Polaris 北极星 · 健康数据说明\n\n"
            + "仅在你主动点击“读取昨日”时，读取 Health Connect 中已授权的昨日步数与平均心率。"
            + "没有获得的数据不会填零或伪造。\n\n"
            + "只有在你再次点击“同步到飞书”后，数据才会发送到你配置的 Mac 健康同步接口。"
            + "Mac 端将健康日汇总保存到个人用户目录，并在配置飞书 Webhook 后向飞书工作流提交。\n\n"
            + "Polaris 不读取 NFC 卡、通讯录、位置或任何其他无关信息。"
            + "你可以随时在系统 Health Connect 设置中撤销权限。\n\n"
            + "健康数据属于个人隐私。请仅使用自己控制的服务器和可信的网络。");
        scroll.addView(text);
        setContentView(scroll);
    }
}
