const fs=require('fs'),f='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(f,'utf8');
const P=['READ_CALENDAR','WRITE_CALENDAR','SCHEDULE_EXACT_ALARM','USE_EXACT_ALARM','POST_NOTIFICATIONS','RECEIVE_BOOT_COMPLETED','VIBRATE','WAKE_LOCK','FOREGROUND_SERVICE','FOREGROUND_SERVICE_MEDIA_PLAYBACK'].filter(p=>!m.includes('android.permission.'+p+'"')).map(p=>'<uses-permission android:name="android.permission.'+p+'"/>').join('');
m=m.replace('</manifest>',P+'</manifest>');
if(!m.includes('barcode_ui'))m=m.replace('</application>','<meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui,ocr"/></application>');
if(!m.includes('NotifSvc'))m=m.replace('</application>','<service android:name=".NotifSvc" android:label="Jejum e Dieta" android:exported="true" android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"><intent-filter><action android:name="android.service.notification.NotificationListenerService"/></intent-filter></service></application>');
if(!m.includes('AlarmService'))m=m.replace('</application>','<receiver android:name=".AlarmReceiver" android:exported="false"/><receiver android:name=".BootReceiver" android:exported="true"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter></receiver><service android:name=".AlarmService" android:exported="false" android:foregroundServiceType="mediaPlayback"/></application>');
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
    registerPlugin(AlarmNow.class);
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
fs.writeFileSync(d+'OcrNow.java',`package com.eu.jejumdieta;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
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
import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;

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
          closeQuiet(rec);
        })
        .addOnFailureListener(e -> {
          call.reject(String.valueOf(e.getMessage()));
          closeQuiet(rec);
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
          closeQuiet(lab);
        })
        .addOnFailureListener(e -> {
          call.reject(String.valueOf(e.getMessage()));
          closeQuiet(lab);
        });
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }
  private static void closeQuiet(Closeable c) {
    try {
      c.close();
    } catch (Exception ignored) {
    }
  }

  // renderiza as primeiras paginas de um PDF (base64) como JPEG base64
  @PluginMethod
  public void pdfPages(final PluginCall call) {
    String s = call.getString("b");
    int max = call.getInt("max", 4);
    if (s == null) {
      call.reject("sem pdf");
      return;
    }
    File tmp = null;
    try {
      byte[] bytes = Base64.decode(s, Base64.DEFAULT);
      tmp = File.createTempFile("ficha", ".pdf", getContext().getCacheDir());
      FileOutputStream fo = new FileOutputStream(tmp);
      fo.write(bytes);
      fo.close();
      ParcelFileDescriptor pfd = ParcelFileDescriptor.open(tmp, ParcelFileDescriptor.MODE_READ_ONLY);
      PdfRenderer r = new PdfRenderer(pfd);
      JSArray out = new JSArray();
      int n = Math.min(r.getPageCount(), max);
      for (int i = 0; i < n; i++) {
        PdfRenderer.Page p = r.openPage(i);
        int w = 1600;
        int h = Math.max(1, (int) ((float) p.getHeight() / (float) p.getWidth() * w));
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        bm.eraseColor(Color.WHITE);
        p.render(bm, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
        p.close();
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        bm.compress(Bitmap.CompressFormat.JPEG, 85, bo);
        out.put(Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
        bm.recycle();
      }
      r.close();
      pfd.close();
      JSObject o = new JSObject();
      o.put("pages", out);
      o.put("count", n);
      call.resolve(o);
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    } finally {
      if (tmp != null) tmp.delete();
    }
  }
}
`);
fs.writeFileSync(d+'AlarmUtil.java',`package com.eu.jejumdieta;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

final class AlarmUtil {
  static final String ACT = "com.eu.jejumdieta.ALARM";

  private AlarmUtil() {}

  static SharedPreferences sp(Context c) {
    return c.getSharedPreferences("jd_alarm", Context.MODE_PRIVATE);
  }

  static JSONArray list(Context c) {
    try {
      return new JSONArray(sp(c).getString("list", "[]"));
    } catch (Exception e) {
      return new JSONArray();
    }
  }

  static boolean has(JSONArray a, int v) {
    if (a == null) return false;
    for (int i = 0; i < a.length(); i++) if (a.optInt(i, -1) == v) return true;
    return false;
  }

  // proximo disparo (ms) depois de "after"; dias 0=domingo..6=sabado; vazio = todo dia
  static long next(int hour, int minute, JSONArray days, long after) {
    Calendar c = Calendar.getInstance();
    c.setTimeInMillis(after);
    for (int i = 0; i < 8; i++) {
      Calendar t = (Calendar) c.clone();
      t.add(Calendar.DAY_OF_YEAR, i);
      t.set(Calendar.HOUR_OF_DAY, hour);
      t.set(Calendar.MINUTE, minute);
      t.set(Calendar.SECOND, 0);
      t.set(Calendar.MILLISECOND, 0);
      if (t.getTimeInMillis() <= after) continue;
      int dow = t.get(Calendar.DAY_OF_WEEK) - 1;
      if (days == null || days.length() == 0 || has(days, dow)) return t.getTimeInMillis();
    }
    return 0;
  }

  static PendingIntent open(Context c) {
    Intent show = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
    if (show == null) show = new Intent();
    return PendingIntent.getActivity(c, 0, show, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  static PendingIntent fire(Context c, int id, String title, String body) {
    Intent i = new Intent(c, AlarmReceiver.class);
    i.setAction(ACT);
    i.putExtra("id", id);
    i.putExtra("title", title);
    i.putExtra("body", body);
    return PendingIntent.getBroadcast(c, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  static boolean canExact(Context c) {
    if (Build.VERSION.SDK_INT < 31) return true;
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    return am != null && am.canScheduleExactAlarms();
  }

  static boolean set(Context c, int id, long at, String title, String body) {
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (am == null || at <= 0) return false;
    try {
      am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, open(c)), fire(c, id, title, body));
      return true;
    } catch (SecurityException e) {
      return false;
    }
  }

  static void cancel(Context c, int id) {
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (am != null) am.cancel(fire(c, id, "", ""));
  }

  static int scheduleAll(Context c) {
    JSONArray l = list(c);
    int ok = 0;
    long now = System.currentTimeMillis();
    for (int i = 0; i < l.length(); i++) {
      JSONObject o = l.optJSONObject(i);
      if (o == null) continue;
      long at = next(o.optInt("h"), o.optInt("m"), o.optJSONArray("d"), now);
      if (set(c, o.optInt("id"), at, o.optString("t"), o.optString("b"))) ok++;
    }
    return ok;
  }

  static int saveAll(Context c, JSONArray fresh) {
    JSONArray old = list(c);
    for (int i = 0; i < old.length(); i++) {
      JSONObject o = old.optJSONObject(i);
      if (o != null) cancel(c, o.optInt("id"));
    }
    sp(c).edit().putString("list", fresh.toString()).apply();
    return scheduleAll(c);
  }

  // depois de tocar, agenda a proxima ocorrencia do mesmo alarme
  static void rearm(Context c, int id) {
    JSONArray l = list(c);
    long now = System.currentTimeMillis() + 1500;
    for (int i = 0; i < l.length(); i++) {
      JSONObject o = l.optJSONObject(i);
      if (o != null && o.optInt("id") == id) {
        long at = next(o.optInt("h"), o.optInt("m"), o.optJSONArray("d"), now);
        set(c, id, at, o.optString("t"), o.optString("b"));
      }
    }
  }

  // se nao der para tocar em primeiro plano, avisa com notificacao comum com som de alarme
  static void plainNotify(Context c, String title, String body) {
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;
    Notification.Builder b;
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch = new NotificationChannel("jd_alarm_plain", "Alarme (aviso)", NotificationManager.IMPORTANCE_HIGH);
      ch.setSound(
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
        new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build()
      );
      nm.createNotificationChannel(ch);
      b = new Notification.Builder(c, "jd_alarm_plain");
    } else {
      b = new Notification.Builder(c);
    }
    b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(body).setAutoCancel(true).setContentIntent(open(c));
    nm.notify(7002, b.build());
  }
}
`);
fs.writeFileSync(d+'AlarmReceiver.java',`package com.eu.jejumdieta;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context c, Intent in) {
    int id = in.getIntExtra("id", 0);
    String t = in.getStringExtra("title");
    String b = in.getStringExtra("body");
    AlarmUtil.rearm(c, id);
    Intent s = new Intent(c, AlarmService.class);
    s.putExtra("title", t);
    s.putExtra("body", b);
    try {
      if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(s);
      else c.startService(s);
    } catch (Exception e) {
      AlarmUtil.plainNotify(c, t == null ? "Alarme" : t, b == null ? "" : b);
    }
  }
}
`);
fs.writeFileSync(d+'BootReceiver.java',`package com.eu.jejumdieta;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context c, Intent in) {
    AlarmUtil.scheduleAll(c);
  }
}
`);
fs.writeFileSync(d+'AlarmService.java',`package com.eu.jejumdieta;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import java.io.File;

public class AlarmService extends Service {
  static volatile boolean ringing = false;
  static volatile String ringTitle = "";
  static volatile String ringBody = "";
  static final String CH = "jd_alarm_ring";
  static final int NID = 7001;

  private MediaPlayer mp;
  private PowerManager.WakeLock wl;
  private Vibrator vib;
  private final Handler h = new Handler(Looper.getMainLooper());
  private final Runnable auto = new Runnable() {
    @Override
    public void run() {
      stopAll();
    }
  };

  @Override
  public IBinder onBind(Intent i) {
    return null;
  }

  @Override
  public int onStartCommand(Intent in, int flags, int startId) {
    String act = in == null ? null : in.getAction();
    if ("jd.stop".equals(act)) {
      if (!ringing) {
        startForegroundSafe(buildNotification("", ""));
      }
      stopAll();
      return START_NOT_STICKY;
    }
    if ("jd.snooze".equals(act)) {
      if (!ringing) {
        startForegroundSafe(buildNotification("", ""));
      }
      snooze();
      stopAll();
      return START_NOT_STICKY;
    }
    String t = in == null ? null : in.getStringExtra("title");
    String b = in == null ? null : in.getStringExtra("body");
    startRing(t == null ? "Alarme" : t, b == null ? "" : b);
    return START_NOT_STICKY;
  }

  private void createChannel() {
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      NotificationChannel ch = new NotificationChannel(CH, "Alarme tocando", NotificationManager.IMPORTANCE_HIGH);
      ch.setSound(null, null);
      ch.enableVibration(false);
      ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
      if (nm != null) nm.createNotificationChannel(ch);
    }
  }

  private PendingIntent act(String action, int code) {
    Intent i = new Intent(this, AlarmService.class);
    i.setAction(action);
    return PendingIntent.getService(this, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  private Notification buildNotification(String title, String body) {
    createChannel();
    Notification.Builder b;
    if (Build.VERSION.SDK_INT >= 26) b = new Notification.Builder(this, CH);
    else b = new Notification.Builder(this);
    b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(body)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setContentIntent(AlarmUtil.open(this))
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Desligar", act("jd.stop", 1))
      .addAction(android.R.drawable.ic_popup_reminder, "Soneca", act("jd.snooze", 2));
    return b.build();
  }

  private void startForegroundSafe(Notification n) {
    if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
    else startForeground(NID, n);
  }

  private void startRing(String title, String body) {
    if (ringing) stopPlayers();
    ringing = true;
    ringTitle = title;
    ringBody = body;
    startForegroundSafe(buildNotification(title, body));
    try {
      PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
      if (pm != null) {
        wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jejum:alarm");
        wl.acquire(15 * 60 * 1000L);
      }
    } catch (Exception e) {
    }
    play();
    vibrate();
    int sec = AlarmUtil.sp(this).getInt("stopSec", 0);
    h.removeCallbacks(auto);
    if (sec > 0) h.postDelayed(auto, sec * 1000L);
  }

  private void play() {
    try {
      mp = new MediaPlayer();
      mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
      File f = new File(getFilesDir(), "alarm_sound");
      boolean custom = AlarmUtil.sp(this).getBoolean("custom", false) && f.exists() && f.length() > 0;
      try {
        if (custom) mp.setDataSource(f.getAbsolutePath());
        else mp.setDataSource(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
        mp.setLooping(true);
        mp.prepare();
      } catch (Exception e) {
        mp.reset();
        mp.setDataSource(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
        mp.setLooping(true);
        mp.prepare();
      }
      mp.start();
    } catch (Exception e) {
    }
  }

  private void vibrate() {
    try {
      vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
      if (vib != null && vib.hasVibrator()) {
        long[] p = new long[] { 0, 800, 600 };
        if (Build.VERSION.SDK_INT >= 26) vib.vibrate(VibrationEffect.createWaveform(p, 0));
        else vib.vibrate(p, 0);
      }
    } catch (Exception e) {
    }
  }

  private void snooze() {
    int min = AlarmUtil.sp(this).getInt("snooze", 10);
    AlarmUtil.set(this, 9001, System.currentTimeMillis() + min * 60000L, ringTitle, ringBody);
  }

  private void stopPlayers() {
    try {
      if (mp != null) {
        mp.stop();
        mp.release();
      }
    } catch (Exception e) {
    }
    mp = null;
    try {
      if (vib != null) vib.cancel();
    } catch (Exception e) {
    }
    try {
      if (wl != null && wl.isHeld()) wl.release();
    } catch (Exception e) {
    }
    wl = null;
  }

  private void stopAll() {
    h.removeCallbacks(auto);
    stopPlayers();
    ringing = false;
    stopForeground(true);
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm != null) nm.cancel(NID);
    stopSelf();
  }

  @Override
  public void onDestroy() {
    h.removeCallbacks(auto);
    stopPlayers();
    ringing = false;
    super.onDestroy();
  }
}
`);
fs.writeFileSync(d+'AlarmNow.java',`package com.eu.jejumdieta;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "AlarmNow")
public class AlarmNow extends Plugin {
  private JSObject info() {
    Context c = getContext();
    JSObject o = new JSObject();
    o.put("custom", AlarmUtil.sp(c).getBoolean("custom", false));
    o.put("name", AlarmUtil.sp(c).getString("name", ""));
    o.put("stopSec", AlarmUtil.sp(c).getInt("stopSec", 0));
    o.put("snooze", AlarmUtil.sp(c).getInt("snooze", 10));
    o.put("exact", AlarmUtil.canExact(c));
    o.put("ringing", AlarmService.ringing);
    o.put("title", AlarmService.ringTitle);
    o.put("body", AlarmService.ringBody);
    return o;
  }

  @PluginMethod
  public void state(PluginCall call) {
    call.resolve(info());
  }

  @PluginMethod
  public void setAll(PluginCall call) {
    JSArray l = call.getArray("alarms");
    if (l == null) l = new JSArray();
    int ok = AlarmUtil.saveAll(getContext(), l);
    JSObject o = new JSObject();
    o.put("ok", ok);
    o.put("total", l.length());
    o.put("exact", AlarmUtil.canExact(getContext()));
    call.resolve(o);
  }

  @PluginMethod
  public void config(PluginCall call) {
    android.content.SharedPreferences.Editor e = AlarmUtil.sp(getContext()).edit();
    Integer s = call.getInt("stopSec");
    Integer z = call.getInt("snooze");
    if (s != null) e.putInt("stopSec", Math.max(0, s));
    if (z != null) e.putInt("snooze", Math.max(1, z));
    e.apply();
    call.resolve(info());
  }

  @PluginMethod
  public void pickSound(PluginCall call) {
    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    i.addCategory(Intent.CATEGORY_OPENABLE);
    i.setType("audio/*");
    startActivityForResult(call, i, "pickResult");
  }

  @ActivityCallback
  private void pickResult(PluginCall call, ActivityResult result) {
    if (call == null) return;
    if (result == null || result.getResultCode() != android.app.Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
      JSObject o = info();
      o.put("cancelled", true);
      call.resolve(o);
      return;
    }
    Uri u = result.getData().getData();
    Context c = getContext();
    try {
      ContentResolver cr = c.getContentResolver();
      String name = "musica";
      Cursor cu = cr.query(u, null, null, null, null);
      if (cu != null) {
        try {
          int ix = cu.getColumnIndex(OpenableColumns.DISPLAY_NAME);
          if (ix >= 0 && cu.moveToFirst()) name = cu.getString(ix);
        } finally {
          cu.close();
        }
      }
      File f = new File(c.getFilesDir(), "alarm_sound");
      InputStream in = cr.openInputStream(u);
      if (in == null) {
        call.reject("nao foi possivel abrir o arquivo");
        return;
      }
      OutputStream out = new FileOutputStream(f);
      byte[] buf = new byte[65536];
      long total = 0;
      int n;
      while ((n = in.read(buf)) > 0) {
        total += n;
        if (total > 40L * 1024 * 1024) {
          in.close();
          out.close();
          f.delete();
          call.reject("arquivo grande demais (limite 40 MB)");
          return;
        }
        out.write(buf, 0, n);
      }
      in.close();
      out.close();
      AlarmUtil.sp(c).edit().putBoolean("custom", true).putString("name", name).apply();
      call.resolve(info());
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }

  @PluginMethod
  public void clearSound(PluginCall call) {
    Context c = getContext();
    new File(c.getFilesDir(), "alarm_sound").delete();
    AlarmUtil.sp(c).edit().putBoolean("custom", false).putString("name", "").apply();
    call.resolve(info());
  }

  private void send(String action, String title, String body) {
    Context c = getContext();
    Intent s = new Intent(c, AlarmService.class);
    if (action != null) s.setAction(action);
    if (title != null) s.putExtra("title", title);
    if (body != null) s.putExtra("body", body);
    if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(s);
    else c.startService(s);
  }

  @PluginMethod
  public void test(PluginCall call) {
    try {
      send(null, "Teste do alarme", "Toque em Desligar para parar");
      call.resolve(info());
    } catch (Exception e) {
      call.reject(String.valueOf(e.getMessage()));
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    if (AlarmService.ringing) {
      try {
        send("jd.stop", null, null);
      } catch (Exception e) {
      }
    }
    call.resolve(info());
  }

  @PluginMethod
  public void snooze(PluginCall call) {
    if (AlarmService.ringing) {
      try {
        send("jd.snooze", null, null);
      } catch (Exception e) {
      }
    }
    call.resolve(info());
  }

  @PluginMethod
  public void openExact(PluginCall call) {
    try {
      Intent i;
      if (Build.VERSION.SDK_INT >= 31) {
        i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName()));
      } else {
        i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
      }
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(i);
      call.resolve();
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
