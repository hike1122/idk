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
    registerPlugin(OcrNow.class);
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
// OcrNow: read() devolve linhas, palavras com caixa e ângulo (para montar a tabela do rótulo);
// labels() reconhece o tipo de comida na foto (ML Kit, no aparelho)
fs.writeFileSync(d+'OcrNow.java',`package com.eu.jejumdieta;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Point;
import android.graphics.Rect;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.label.ImageLabel;
import com.google.mlkit.vision.label.ImageLabeler;
import com.google.mlkit.vision.label.ImageLabeling;
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "OcrNow")
public class OcrNow extends Plugin {
  private Bitmap decode(PluginCall call) {
    String s = call.getString("b");
    if (s == null) {
      call.reject("sem imagem");
      return null;
    }
    try {
      byte[] b = Base64.decode(s, Base64.DEFAULT);
      Bitmap bmp = BitmapFactory.decodeByteArray(b, 0, b.length);
      if (bmp == null) call.reject("imagem invalida");
      return bmp;
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
      return null;
    }
  }

  @PluginMethod
  public void read(final PluginCall call) {
    Bitmap bmp = decode(call);
    if (bmp == null) return;
    int rot = call.getInt("rot", 0);
    try {
      final TextRecognizer rec = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
      rec
        .process(InputImage.fromBitmap(bmp, rot))
        .addOnSuccessListener(t -> {
          JSArray ls = new JSArray();
          JSArray ws = new JSArray();
          for (Text.TextBlock bl : t.getTextBlocks()) {
            for (Text.Line ln : bl.getLines()) {
              ls.put(ln.getText());
              double ang = 0;
              Point[] cp = ln.getCornerPoints();
              if (cp != null && cp.length == 4) ang = Math.toDegrees(Math.atan2(cp[1].y - cp[0].y, cp[1].x - cp[0].x));
              for (Text.Element el : ln.getElements()) {
                Rect r = el.getBoundingBox();
                if (r == null) continue;
                JSObject w = new JSObject();
                w.put("t", el.getText());
                w.put("x0", r.left);
                w.put("y0", r.top);
                w.put("x1", r.right);
                w.put("y1", r.bottom);
                w.put("a", ang);
                ws.put(w);
              }
            }
          }
          JSObject o = new JSObject();
          o.put("lines", ls);
          o.put("w", ws);
          call.resolve(o);
          rec.close();
        })
        .addOnFailureListener(e -> {
          call.reject(String.valueOf(e.getMessage()));
          rec.close();
        });
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }

  @PluginMethod
  public void labels(final PluginCall call) {
    Bitmap bmp = decode(call);
    if (bmp == null) return;
    try {
      final ImageLabeler lab = ImageLabeling.getClient(new ImageLabelerOptions.Builder().setConfidenceThreshold(0.4f).build());
      lab
        .process(InputImage.fromBitmap(bmp, 0))
        .addOnSuccessListener(list -> {
          JSArray a = new JSArray();
          for (ImageLabel l : list) {
            JSObject o = new JSObject();
            o.put("t", l.getText());
            o.put("c", (double) l.getConfidence());
            a.put(o);
          }
          JSObject r = new JSObject();
          r.put("labels", a);
          call.resolve(r);
          lab.close();
        })
        .addOnFailureListener(e -> {
          call.reject(String.valueOf(e.getMessage()));
          lab.close();
        });
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }
}
`);
const g='android/app/build.gradle';let gb=fs.readFileSync(g,'utf8');
if(!gb.includes('mlkit:text-recognition'))gb=gb.replace(/dependencies\s*\{/,"dependencies {\n    implementation 'com.google.mlkit:text-recognition:16.0.1'");
if(!gb.includes('mlkit:image-labeling'))gb=gb.replace(/dependencies\s*\{/,"dependencies {\n    implementation 'com.google.mlkit:image-labeling:17.0.9'");
fs.writeFileSync(g,gb);
