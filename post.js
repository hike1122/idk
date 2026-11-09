const fs=require('fs'),f='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(f,'utf8');
const P=['READ_CALENDAR','WRITE_CALENDAR','SCHEDULE_EXACT_ALARM','POST_NOTIFICATIONS','RECEIVE_BOOT_COMPLETED'].filter(p=>!m.includes(p)).map(p=>'<uses-permission android:name="android.permission.'+p+'"/>').join('');
m=m.replace('</manifest>',P+'</manifest>');
if(!m.includes('barcode_ui'))m=m.replace('</application>','<meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/></application>');
fs.writeFileSync(f,m);
