/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package __ID__;

import android.os.Bundle;
import org.apache.cordova.*;
import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
import android.view.ActionMode;
import android.view.View;
import android.graphics.Color;

public class __ACTIVITY__ extends CordovaActivity
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        // enable Cordova apps to be started in the background
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }

        // Set by <content src="index.html" /> in config.xml
        loadUrl(launchUrl);
        
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){//4.4
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {//5.0+
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        }
    }

    @Override
    public void onActionModeStarted(ActionMode mode) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
        appView.loadUrl("javascript:cordova.fireWindowEvent('native.actionmodeshow');");
      }
      super.onActionModeStarted(mode);
    }

    @Override
    public void onActionModeFinished(ActionMode mode) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
        appView.loadUrl("javascript:cordova.fireWindowEvent('native.actionmodehide');");
      }
      super.onActionModeFinished(mode);
    }
}
