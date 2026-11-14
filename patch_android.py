# Ajustes al proyecto Android generado: permisos de guardado, orientación vertical.
import re, pathlib
p = pathlib.Path("android/app/src/main/AndroidManifest.xml")
s = p.read_text(encoding="utf-8")
if "WRITE_EXTERNAL_STORAGE" not in s:
    s = s.replace("</manifest>", '    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />\n</manifest>')
if "requestLegacyExternalStorage" not in s:
    s = s.replace("<application", '<application android:requestLegacyExternalStorage="true"', 1)
if "screenOrientation" not in s:
    s = s.replace("<activity", '<activity android:screenOrientation="portrait"', 1)
p.write_text(s, encoding="utf-8")
print("Manifest actualizado")
