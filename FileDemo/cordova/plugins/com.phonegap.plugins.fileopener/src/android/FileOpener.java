package com.phonegap.plugins.fileopener;

import java.io.File;
import java.net.URI;
import java.net.URLConnection;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import com.phonegap.plugins.fileopener.FileProvider;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;


import android.os.Build;
import android.util.Log;

//import android.util.Log;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CordovaResourceApi;

public class FileOpener extends CordovaPlugin {

	/**
	 * Executes the request and returns a boolean.
	 * 
	 * @param action
	 *            The action to execute.
	 * @param args
	 *            JSONArry of arguments for the plugin.
	 * @param callbackContext
	 *            The callback context used when calling back into JavaScript.
	 * @return boolean.
	 */
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

		if (action.equals("open")) {

			try {

				return this._open(args.getString(0), callbackContext);

			} catch (JSONException e) {

				JSONObject errorObj = new JSONObject();
				errorObj.put("status", PluginResult.Status.JSON_EXCEPTION.ordinal());
				errorObj.put("message", e.getMessage());
				callbackContext.error(errorObj);
				return false;
			}

		} else {

			JSONObject errorObj = new JSONObject();
			errorObj.put("status", PluginResult.Status.INVALID_ACTION.ordinal());
			errorObj.put("message", "Invalid action");
			callbackContext.error(errorObj);
			return false;

		}

	}

	private boolean _open(String fileArg, CallbackContext callbackContext) throws JSONException {
		String fileName = "";
		try {
	        //fileName = new URI(fileArg).getPath();
			CordovaResourceApi resourceApi = webView.getResourceApi();
			Uri fileUri = resourceApi.remapUri(Uri.parse(fileArg));
			fileName = this.stripFileProtocol(fileUri.toString());
		} catch (Exception e) {
			fileName = fileArg;
		}		
        
		File file = new File(fileName);

		if (file.exists()) {

			try {

				Uri path = Uri.fromFile(file);
				Intent intent = new Intent(Intent.ACTION_VIEW);
				String mime = URLConnection.guessContentTypeFromName(fileArg);
				if(mime == null) mime = "";

				if (mime.equals("application/vnd.android.package-archive")) {
					// https://stackoverflow.com/questions/9637629/can-we-install-an-apk-from-a-contentprovider/9672282#9672282
					intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
					if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
						path = Uri.fromFile(file);
					} else {
						Context context = cordova.getActivity().getApplicationContext();
						path = FileProvider.getUriForFile(context, cordova.getActivity().getPackageName() + ".opener.provider", file);
					}
					intent.setDataAndType(path, mime);
					intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

				} else {
					intent = new Intent(Intent.ACTION_VIEW);
					Context context = cordova.getActivity().getApplicationContext();
					path = FileProvider.getUriForFile(context, cordova.getActivity().getPackageName() + ".opener.provider", file);
					intent.setDataAndType(path, mime);
					intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NO_HISTORY);
				}

				cordova.getActivity().startActivity(intent);
				callbackContext.success();
				return true;

			} catch (android.content.ActivityNotFoundException e) {

				JSONObject errorObj = new JSONObject();
				errorObj.put("status", PluginResult.Status.ERROR.ordinal());
				errorObj.put("message", "Activity not found: " + e.getMessage());
				callbackContext.error(errorObj);
				return false;
			}

		} else {

			JSONObject errorObj = new JSONObject();
			errorObj.put("status", PluginResult.Status.ERROR.ordinal());
			errorObj.put("message", "File not found");
			callbackContext.error(errorObj);
			return false;

		}
	}

	private String stripFileProtocol(String uriString) {
		if (uriString.startsWith("file://")) {
			uriString = uriString.substring(7);
		} else if (uriString.startsWith("content://")) {
			uriString = uriString.substring(10);
		}
		return uriString;
	}
}
