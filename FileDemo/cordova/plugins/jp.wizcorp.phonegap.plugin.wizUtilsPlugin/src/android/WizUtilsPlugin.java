package jp.wizcorp.phonegap.plugin.wizUtilsPlugin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.provider.MediaStore;
import android.view.Display;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import java.io.File;
import java.io.FileNotFoundException;
import java.net.URI;
import java.net.URISyntaxException;

import android.os.Environment;

/**
 * 
 * @author Wizcorp Inc. [ Incorporated Wizards ] Copyright 2014
 * file WizUtilsPlugin.java for PhoneGap
 *
 */
public class WizUtilsPlugin extends CordovaPlugin {

    private Context appContext;

    @SuppressLint("NewApi")
    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {

        Activity act = cordova.getActivity();
        appContext = act.getApplicationContext();
        PackageManager pm = act.getPackageManager();
        
        if (action.equals("getAppFileName")) {
            String label = "(unknown)";
            try {
                ApplicationInfo ai = pm.getApplicationInfo(act.getPackageName(), 0);
                String fullDir = ai.publicSourceDir;
                label = fullDir.split(File.separator)[fullDir.split(File.separator).length - 1];
            } catch (PackageManager.NameNotFoundException e) {
            }
            callbackContext.success(label);
            return true;

        } else if (action.equals("getVersionCode")) {
            int versionCode = getVersionCode();
            callbackContext.success(versionCode);
            return true;

        } else if (action.equals("getVersionName")) {
            String versionName = getVersionName();
            callbackContext.success(versionName);
            return true;

        } else if (action.equals("getVersion")) {
            int versionCode = getVersionCode();
            String versionName = getVersionName();

            JSONObject result = new JSONObject();
            result.put("code", versionCode);
            result.put("name", versionName);

            callbackContext.success(result);
            return true;

        }  else if (action.equals("getBundleDisplayName")) {
            ApplicationInfo ai;
            try {
                ai = pm.getApplicationInfo( act.getPackageName(), 0);
            } catch (PackageManager.NameNotFoundException e) {
                ai = null;
            }
            // If unknown we set to "(unknown)"
            String applicationName = (String) (ai != null ? pm.getApplicationLabel(ai) : "(unknown)");
            callbackContext.success(applicationName);
            return true;

        } else if (action.equals("getBundleIdentifier")) {

            String identifier;
            try {
                PackageInfo info = pm.getPackageInfo(act.getPackageName(), 0);
                identifier = info.packageName;
            } catch (Exception e) {
                identifier = null;
            }

            callbackContext.success(identifier);
            return true;

        } else if (action.equals("getDeviceHeight")) {

            Display mDisplay = act.getWindowManager().getDefaultDisplay();
            int appHeight = mDisplay.getHeight();
            callbackContext.success(appHeight);
            return true;

        } else if (action.equals("getDeviceWidth")) {

            Display mDisplay = act.getWindowManager().getDefaultDisplay();
            int appWidth = mDisplay.getWidth();
            callbackContext.success(appWidth);
            return true;

        } else if (action.equals("getText")) {

            String pasteText;
            if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB) {
                android.text.ClipboardManager clipboard = (android.text.ClipboardManager) cordova.getActivity().getSystemService(Context.CLIPBOARD_SERVICE);
                pasteText = clipboard.getText().toString();
            } else {
                android.content.ClipboardManager clipboard = (android.content.ClipboardManager) cordova.getActivity().getSystemService(Context.CLIPBOARD_SERVICE);
                ClipData.Item item;
                if (clipboard.getPrimaryClip().getItemCount() > 0) {
                    item = clipboard.getPrimaryClip().getItemAt(0);
                    pasteText = item.getText().toString();
                } else {
                    // clipboard was empty
                    pasteText = "";
                }
            }
            callbackContext.success(pasteText);
            return true;

        } else if (action.equals("setText")) {

            String text2save = args.getString(0);
            if (text2save.length() > 0) {
                if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB) {
                    android.text.ClipboardManager clipboard = (android.text.ClipboardManager) cordova.getActivity().getSystemService(Context.CLIPBOARD_SERVICE);
                    clipboard.setText(text2save);
                } else {
                    android.content.ClipboardManager clipboard = (android.content.ClipboardManager) cordova.getActivity().getSystemService(Context.CLIPBOARD_SERVICE);
                    android.content.ClipData clip = android.content.ClipData.newPlainText("Clip", text2save);
                    clipboard.setPrimaryClip(clip);
                }
            }
            callbackContext.success();
            return true;

        } else if (action.equals("getFolderSize")) {

            final String dir = args.getString(0);
            Uri uri = Uri.parse(dir);
            final String path = uri.getPath();

            cordova.getThreadPool().execute(new Runnable() {
                public void run() {
                    long size = dirSize(path);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, size));
                }
            });
            return true;

        } else if(action.equals("saveToAlbum")){
            String uri = args.getString(0);
            try {
                MediaStore.Images.Media.insertImage(act.getContentResolver(), new URI(uri).getPath(), "Imagerio" , "Photo taken at Imagerio");
                callbackContext.success();
            } catch (FileNotFoundException e) {
                e.printStackTrace();
                callbackContext.error(e.getMessage());
            } catch (URISyntaxException e) {
                e.printStackTrace();
                callbackContext.error(e.getMessage());
            }
            return true;
        } else {
            callbackContext.error("Invalid action");
            return false;
        }
    }


    private int getVersionCode() {
        String packageName = this.appContext.getPackageName();
        int versionCode = -1;
        try {
            PackageInfo info = this.appContext.getPackageManager().getPackageInfo(packageName, 0);
            versionCode = info.versionCode;            
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        
        Class xwalkClass = null;
        try {
          xwalkClass = Class.forName("org.crosswalk.engine.XWalkCordovaView");
        } catch (ClassNotFoundException e) {
        }
        
        if(xwalkClass != null) {
          versionCode = versionCode / 10;
        }
        return versionCode;
    }
    private String getVersionName() {
        String packageName = this.appContext.getPackageName();
        PackageInfo pInfo = null;
        try {
            pInfo = this.appContext.getPackageManager().getPackageInfo(packageName, 0);
        } catch (PackageManager.NameNotFoundException e) {
        }
        String versionName = "0";
        if (pInfo != null) {
            versionName = pInfo.versionName;
        }
        return versionName;
    }

    private long dirSize(String path) {

        File dir = new File(path);

        if (dir.exists()) {
            return getFolderSize(dir);
        }

        return 0;
    }

    private long getFolderSize(File dir) {
        if (dir.exists()) {
            long result = 0;
            File[] fileList = dir.listFiles();
            for (int i = 0; i < fileList.length; i++) {
                // Recursive call if it's a directory
                if (fileList[i].isDirectory()) {
                    result += getFolderSize(fileList[i]);
                } else {
                    // Sum the file size in bytes
                    result += fileList[i].length();
                }
            }
            return result; // return the file size
        }
        return 0;
    }
}
