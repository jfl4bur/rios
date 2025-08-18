Rutas & Ríos — Mobile (Flutter)

Este directorio contiene una pequeña app Flutter demo que lista rutas desde el backend y muestra una pantalla de detalle con un placeholder de mapa.

Requisitos:
- Flutter SDK instalado.
- (Opcional) Para mapas en producción usa el plugin `google_maps_flutter` y configura la API key en AndroidManifest/Info.plist.

Ejecutar (desarrollo):
1. Abre un terminal PowerShell en la raíz `mobile\`.
2. Ejecuta `flutter pub get`.
3. Ejecuta `flutter run` para lanzar en emulador o dispositivo conectado.

Notas:
- La app intenta conectarse a `http://localhost:9000/api/rios`. Si no encuentra el backend, carga datos demo.
- Para usar Google Maps: añade `google_maps_flutter` en `pubspec.yaml`, sigue la guía oficial y añade la API key.
 - Para usar Google Maps: añade `google_maps_flutter` en `pubspec.yaml` (ya incluido en este scaffold). Sigue la guía oficial y añade la API key.

Configuración rápida de Google Maps API key

Android:
- Abre `android/app/src/main/AndroidManifest.xml` y añade dentro de `<application>`:

```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_API_KEY_HERE"/>
```

iOS:
- En iOS añade la clave en `ios/Runner/AppDelegate.swift` o en `Info.plist` según la guía de `google_maps_flutter`.

Emuladores / permisos:
- En emulador Android asegúrate de tener Google Play services si usas mapas.
- Para probar ubicación en emulador, usa el panel de emulador para fijar coordenadas simuladas.

Permisos de ubicación (Android / iOS)

Android:
- Añade en `android/app/src/main/AndroidManifest.xml` dentro de `<manifest>`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Y en `<application>` añade la meta-data de Google Maps (API key) como se indica arriba.

iOS:
- Abre `ios/Runner/Info.plist` y añade claves de uso de ubicación:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>La app necesita acceso a tu ubicación para centrar el mapa.</string>
```

Después de esto, la app pedirá permisos en tiempo de ejecución usando `geolocator`.

Notas:
- Cambia `YOUR_API_KEY_HERE` por tu clave; no la subas al repositorio. Para CI/entornos usa variables de entorno o secretos.
- Si no configuras la API key, la app mostrará el placeholder con las coordenadas en la pantalla de detalle.

Waypoints y geometry

 - La pantalla de creación permite seleccionar waypoints en un mapa (tap para añadir). Los waypoints se envían al backend como una lista de `{lat,lng}` y además se incluye un campo `geometry` en formato GeoJSON (LineString si hay varios puntos, Point si sólo hay uno).
 - El backend debe aceptar el campo `geometry` o `waypoints` en la creación de la ruta; el scaffold cliente usa `waypoints` y `geometry` en el payload JSON.
- Esta scaffold es minimal: añade autenticación, subida de fotos y rutas GPX según necesites.
