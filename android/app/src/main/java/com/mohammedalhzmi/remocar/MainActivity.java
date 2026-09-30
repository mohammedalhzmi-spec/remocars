package com.mohammedalhzmi.remocar;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import com.mohammedalhzmi.remocar.LanHostPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(LanHostPlugin.class);
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveMode();
    }

    private void applyImmersiveMode() {
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        getWindow().getDecorView().setSystemUiVisibility(flags);
    }
}
