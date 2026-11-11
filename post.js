const fs=require('fs'),f='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(f,'utf8');
const P=['READ_CALENDAR','WRITE_CALENDAR','SCHEDULE_EXACT_ALARM','POST_NOTIFICATIONS','RECEIVE_BOOT_COMPLETED','VIBRATE'].filter(p=>!m.includes(p)).map(p=>'<uses-permission android:name="android.permission.'+p+'"/>').join('');
m=m.replace('</manifest>',P+'</manifest>');
if(!m.includes('barcode_ui'))m=m.replace('</application>','<meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui,ocr"/></application>');
if(!m.includes('NotifSvc'))m=m.replace('</application>','<service android:name=".NotifSvc" android:label="Jejum e Dieta" android:exported="true" android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"><intent-filter><action android:name="android.service.notification.NotificationListenerService"/></intent-filter></service></application>');
fs.writeFileSync(f,m);
const d='android/app/src/main/java/com/eu/jejumdieta/';fs.mkdirSync(d,{recursive:true});
fs.writeFileSync(d+'NotifSvc.java',`package com.eu.jejumdieta;

import android.service.notification.NotificationListenerService;

public class NotifSvc extends NotificationListenerService {}
`);
fs.writeFileSync(d+'MainActivity.java',`package com.eu.jejumdieta;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(MediaNow.class);
    super.onCreate(savedInstanceState);
  }
}
`);
fs.writeFileSync(d+'MediaNow.java',`package com.eu.jejumdieta;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSession;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.util.List;

@CapacitorPlugin(name = "MediaNow")
public class MediaNow extends Plugin {
  private MediaController ctl() {
    try {
      MediaSessionManager m = (MediaSessionManager) getContext().getSystemService(Context.MEDIA_SESSION_SERVICE);
      List<MediaController> l = m.getActiveSessions(new ComponentName(getContext(), NotifSvc.class));
      if (l == null || l.isEmpty()) return null;
      for (MediaController c : l) {
        PlaybackState s = c.getPlaybackState();
        if (s != null && s.getState() == PlaybackState.STATE_PLAYING) return c;
      }
      return l.get(0);
    } catch (Exception e) {
      return null;
    }
  }

  @PluginMethod
  public void enabled(PluginCall call) {
    String s = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
    JSObject o = new JSObject();
    o.put("on", s != null && s.contains(getContext().getPackageName()));
    call.resolve(o);
  }

  @PluginMethod
  public void settings(PluginCall call) {
    Intent i = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(i);
    call.resolve();
  }

  @PluginMethod
  public void now(PluginCall call) {
    JSObject o = new JSObject();
    MediaController c = ctl();
    if (c != null) {
      MediaMetadata md = c.getMetadata();
      PlaybackState ps = c.getPlaybackState();
      boolean playing = ps != null && ps.getState() == PlaybackState.STATE_PLAYING;
      long pos = 0;
      if (ps != null) {
        pos = ps.getPosition();
        if (playing) pos += (long) ((SystemClock.elapsedRealtime() - ps.getLastPositionUpdateTime()) * ps.getPlaybackSpeed());
      }
      o.put("has", true);
      o.put("app", c.getPackageName());
      o.put("playing", playing);
      o.put("pos", pos);
      o.put("active", ps != null ? ps.getActiveQueueItemId() : -1L);
      if (md != null) {
        o.put("title", md.getString(MediaMetadata.METADATA_KEY_TITLE));
        o.put("artist", md.getString(MediaMetadata.METADATA_KEY_ARTIST));
        o.put("album", md.getString(MediaMetadata.METADATA_KEY_ALBUM));
        o.put("dur", md.getLong(MediaMetadata.METADATA_KEY_DURATION));
        try {
          Bitmap b = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
          if (b == null) b = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
          if (b != null) {
            Bitmap sm = Bitmap.createScaledBitmap(b, 200, 200, true);
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            sm.compress(Bitmap.CompressFormat.JPEG, 70, bo);
            o.put("art", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
          }
        } catch (Exception e) {
        }
      }
      JSArray q = new JSArray();
      List<MediaSession.QueueItem> ql = c.getQueue();
      if (ql != null) {
        int n = 0;
        for (MediaSession.QueueItem it : ql) {
          if (n++ >= 40) break;
          CharSequence t = it.getDescription().getTitle();
          CharSequence a = it.getDescription().getSubtitle();
          JSObject qo = new JSObject();
          qo.put("id", it.getQueueId());
          qo.put("t", (t == null ? "" : t.toString()) + (a == null ? "" : " - " + a));
          q.put(qo);
        }
      }
      o.put("queue", q);
    } else {
      o.put("has", false);
    }
    call.resolve(o);
  }

  @PluginMethod
  public void cmd(PluginCall call) {
    MediaController c = ctl();
    String a = call.getString("a");
    if (c != null && a != null) {
      MediaController.TransportControls t = c.getTransportControls();
      if (a.equals("next")) t.skipToNext();
      else if (a.equals("prev")) t.skipToPrevious();
      else if (a.equals("seek")) {
        Long ms = call.getLong("ms");
        if (ms != null) t.seekTo(ms);
      } else if (a.equals("queue")) {
        Long id = call.getLong("id");
        if (id != null) t.skipToQueueItem(id);
      } else {
        PlaybackState s = c.getPlaybackState();
        if (s != null && s.getState() == PlaybackState.STATE_PLAYING) t.pause();
        else t.play();
      }
    }
    call.resolve();
  }
}
`);
