# Pesaje de Aves — Agroinversiones SAI-RAM, C.A

Desarrollado por Analista de sistemas Eber Romero

App Android 100 % offline para el formato FO-ENG-004 (Registro de pesaje de aves).
12 galpones → 4 corrales (A, B, C, D) → pesadas (cantidad de aves + peso total en kg; la app lo convierte y muestra en gramos).
Calcula promedio por corral y por galpón (promedio de los 4 corrales), compara con la
tabla de referencia Ross 308 AP (días 0 a 56) y proyecta el alimento que debería consumir el ave y exporta el Excel con el formato de la planilla.
Los datos quedan guardados en el teléfono; no usa internet.

## Cómo obtener el APK (una sola vez, con GitHub)

1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Sube estos archivos a la raíz del repositorio (Add file → Upload files):
   `index.html`, `app.js`, `core.js`, `excel.js`, `package.json`,
   `capacitor.config.json`, `patch_android.py`, `make_icon.py`.
3. Crea el archivo del flujo de compilación: Add file → Create new file, y en el nombre
   escribe exactamente `.github/workflows/build-apk.yml` (al escribir las "/" se crean las
   carpetas). Pega dentro el contenido del archivo `build-apk.yml` que viene en el zip. Commit.
4. Entra en la pestaña **Actions** → "Compilar APK". Se ejecuta solo al subir los archivos
   (o pulsa **Run workflow**). Tarda unos 5–8 minutos.
5. Al terminar (check verde), abre la ejecución y baja el archivo **PesajeAves-APK**
   (Artifacts). Descomprime el zip: dentro está `app-debug.apk`.
6. Instala el APK en el teléfono (permite "instalar apps desconocidas" si lo pide).

## Uso

- Pantalla principal: toca un galpón. Los cuadritos A B C D muestran el avance de cada corral
  (gris = vacío, amarillo = en proceso, verde = meta alcanzada). Meta por defecto: 100 aves
  (se cambia con el engranaje ⚙).
- Dentro del galpón: pon Fecha y Edad (días) y toca un corral. El nombre de la Granja se escribe una sola vez y queda guardado para todos los galpones y jornadas hasta que lo cambies.
- Dentro del corral: escribe cantidad de aves y peso total en KILOS de cada tanda
  (ej. 9 aves, 30.1 kg = 30.100 g) y toca "Agregar pesada". Abajo se ve siempre el total de aves,
  el peso total y el promedio. Un error se corrige con la ✕ de la fila.
- "Generar Excel del galpón": crea el Excel con el formato de la planilla, ya relleno, y abre
  el menú de compartir (guardar en archivos, WhatsApp, correo, Drive…).
  También intenta dejar una copia en Documentos/PesajeAves.
- "Exportar todos a Excel": un solo libro con una hoja por galpón con datos.
- "Respaldo / Restaurar": guarda o recupera todos los datos en un archivo.
- "Nueva jornada": borra todo para empezar a pesar de nuevo (haz el Excel o el respaldo antes).

## Cálculos

- Promedio de corral = peso total ÷ total de aves pesadas.
- Peso promedio del galpón = promedio simple de los promedios de los corrales con datos.
- Comparación: "Similar" si el peso real está dentro de ±3 % del estándar de ese día;
  por encima o por debajo si se sale. Para días entre los de la tabla (16–20, 23–26)
  el estándar se estima por interpolación y se marca como aproximado.

## Varios teléfonos en una misma granja

Ejemplo: una persona pesa los galpones 1 al 3 y otra los galpones 4 al 12.

1. Teléfono 2: **🔄 Respaldo y combinar** → **📤 Enviar por WhatsApp (texto)**. Se manda un mensaje que
   empieza con `PESAJE1:` y termina con `#` (no hay archivos que buscar). También puedes tocar
   **📋 Copiar código** y pegarlo tú en un mensaje.
2. Teléfono principal: copia el mensaje recibido → **🔄 Respaldo y combinar** → pégalo en el cuadro → **🔗 Combinar**.
   Los galpones nuevos se agregan; si un galpón tiene datos en ambos teléfonos la app pregunta cuál conservar.
   Los datos del teléfono principal no se borran por combinar. Se pueden combinar varios mensajes, uno tras otro.
3. Toca la tarjeta **Peso promedio de la granja** para ver el resumen por galpón.
   **Exportar todos a Excel** agrega una primera hoja "Resumen Granja" con los 12 galpones y el promedio de la granja.

El archivo `.json` ("Guardar como archivo") sigue existiendo como alternativa, pero no es necesario.
Peso promedio de la granja = promedio simple de los promedios de los galpones con datos.
Conviene que cada persona pese galpones distintos: si el mismo galpón se carga en dos teléfonos hay que elegir uno.

## Tabla de referencia y alimento (Ross 308 AP, mixto)

- La tabla completa (día 0 a 56) está cargada en `core.js`. Con la **Edad (días)** del galpón, la app compara
  el peso real con el objetivo de ese día (Por encima / Similar / Por debajo, ±3 %), en el galpón y en cada corral.
- **Alimento estándar:** muestra cuántos gramos debería consumir cada ave ese día y el acumulado desde el alojamiento.
  Si escribes **Aves en el galpón** (opcional) calcula los kg del galpón, y proyecta los próximos 7 días.
- El Excel trae la proyección (con fórmulas: se puede cambiar el número de aves en la celda amarilla) y la
  tabla de referencia con los días 7, 14, 21, 28, 35, 42, 49, 56 y el día actual resaltado.

## Licencia centralizada (control mensual desde un solo lugar)

Esto es opcional: mientras no lo configures, la app funciona libre, como hasta ahora.
Sirve para que tú controles, desde un solo panel, que la app siga funcionando en todos
los teléfonos de la granja. Si un mes no renuevas, se bloquea sola en todos.

**Cómo funciona:** cada teléfono, cuando tiene señal (wifi o datos), pregunta en segundo
plano si la licencia sigue activa, y guarda la respuesta por hasta 10 días. Mientras ese
plazo no se cumpla, el teléfono sigue pesando aves sin problema aunque esté sin señal
dentro del galpón. Si pasan más de 10 días sin lograr confirmar, o si tú la desactivas,
la app muestra un aviso ("Licencia no activa / Licencia vencida") y no deja pesar hasta
que vuelva a confirmarse. Un teléfono recién instalado tiene 3 días de margen para
conseguir señal por primera vez.

Esto requiere que la empresa sepa que la app funciona así (que forma parte de las
condiciones de uso que acuerdes), no es algo que deba quedar oculto.

### Configuración (una sola vez, 10–15 minutos)

1. Entra a https://console.firebase.google.com, inicia sesión con una cuenta de Google
   y crea un proyecto nuevo (el plan gratuito "Spark" alcanza de sobra).
2. En el menú lateral, **Compilación → Firestore Database** → "Crear base de datos" →
   modo producción → elige cualquier región.
3. Entra a **Firestore Database → Reglas** y reemplaza todo por esto (cambia
   `TU_UID_AQUI` por el UID que obtienes en el paso 5). Con `{clienteId}` en vez de
   `status`, una misma base de datos sirve para TODAS las granjas/clientes que uses,
   cada una con su propia licencia independiente (ver sección "Varias granjas/clientes"
   más abajo):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /license/{clienteId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == "TU_UID_AQUI";
       }
       match /app/version {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == "TU_UID_AQUI";
       }
     }
   }
   ```
   Publica los cambios.
4. En **Firestore Database → Datos**, crea manualmente el documento inicial:
   colección `license` → documento con ID `status` → agrega los campos:
   `active` (boolean) = `true`, `validUntil` (string) = una fecha `AAAA-MM-DD` cercana
   (por ejemplo, mañana), `note` (string) = vacío.
5. Entra a **Compilación → Authentication** → "Comenzar" → método **Correo y
   contraseña** → habilítalo → pestaña **Users** → "Agregar usuario": pon tu correo y
   una contraseña segura. Esa es tu cuenta de administrador; el UID que aparece junto a
   tu usuario es el que pegas en el paso 3.
6. En **Configuración del proyecto** (el engranaje) → "Tus apps" → agrega una app
   **Web** (ícono `</>`), ponle un nombre y regístrala. Te muestra un bloque `firebaseConfig`
   con `projectId` y `apiKey`: copia esos dos valores.
7. Abre `firebase-config.js` en el proyecto y pon esos dos valores:
   ```js
   window.LICENSE_CONFIG = { PROJECT_ID: 'tu-projectId', API_KEY: 'tu-apiKey' };
   ```
   Sube ese archivo a GitHub junto con los demás (también se usa en la app de los teléfonos,
   y no es información secreta: la seguridad la dan las reglas del paso 3, no esta clave).
8. **Abre `admin.html` como página web, no como archivo descargado.** `admin.html`
   nunca va dentro del APK, es solo tu panel. Si lo abres directo desde
   "Descargas" en el teléfono (la barra de direcciones muestra algo como
   `content://...`), el inicio de sesión se queda pegado en "Entrando…" para
   siempre. Dos formas de evitarlo:
   - **Recomendado — GitHub Pages (gratis, un enlace fijo para siempre):** en tu
     repositorio de GitHub entra a **Settings → Pages**, en "Source" elige
     **"Deploy from a branch"**, selecciona la rama `main` (o `master`) y la
     carpeta `/ (root)`, y guarda. En uno o dos minutos tu panel queda disponible
     en `https://TU-USUARIO.github.io/TU-REPOSITORIO/admin.html`. Guarda ese
     enlace (por ejemplo en tus favoritos) y úsalo cada mes.
   - **Alternativa — desde una computadora:** no le hagas doble clic al archivo;
     haz clic derecho sobre `admin.html` → "Abrir con" → elige tu navegador
     (Chrome, Edge, etc.) directamente.
   Entra con tu correo y contraseña, escribe un código o nota para este mes, los
   días de vigencia (31 por defecto) y pulsa **Activar / renovar licencia**.
9. Para renovar cada mes: vuelve a abrir `admin.html` (desde el enlace de GitHub
   Pages que guardaste, o con "Abrir con"), entra, y pulsa
   **Activar / renovar licencia** de nuevo. Para bloquear la app de inmediato, usa
   **Desactivar licencia**.

> **Nota:** `admin.html` es un panel privado para ti; aunque GitHub Pages lo deja
> en un enlace público, nadie puede cambiar la licencia sin tu correo y
> contraseña de Firebase (eso lo protegen las reglas de seguridad del paso 3).

El plazo de 10 días de margen y los 3 días de instalación están en `license.js`
(`GRACE_DAYS` e `INSTALL_GRACE_DAYS`); si quieres otros números, dímelo.

### Varias granjas / clientes (cada una con su propia licencia)

Un solo APK y un solo proyecto de Firebase pueden servir a varias granjas distintas,
cada una activada y cortada por separado, sin que una afecte a la otra:

1. Al entregar un teléfono a una granja nueva, abre la app, toca 7 veces seguidas
   el título **"Pesaje de Aves"** (arriba) para entrar al **Diagnóstico de licencia**,
   toca **"Cambiar código de cliente"** y ponle un código único a esa granja (por
   ejemplo `CATALDA2`, `LAFINCA`, sin espacios). Hazlo en todos los teléfonos que vayan
   a esa misma granja — un mismo código = comparten una sola licencia.
   La granja original (la tuya) no necesita hacer nada: por defecto todos los teléfonos
   usan el código `status`, igual que hasta ahora.
2. En `admin.html`, arriba de todo hay un campo **"Código de cliente"**. Escribe ahí
   el código de la granja que quieras revisar o renovar (o déjalo en `status` para la
   tuya) y pulsa **"Cargar este cliente"**. Desde ahí, **Renovar licencia** y
   **Desactivar ahora** afectan solo a esa granja — las demás siguen como estaban.
3. No hace falta "crear" nada de antemano: la primera vez que actives un código nuevo
   con **Activar / renovar licencia**, Firebase crea su documento automáticamente.

### Publicar una actualización de la app (sin mandarle el APK a nadie)

Como la app no está en Google Play, Android exige SIEMPRE que el usuario confirme
con un toque la instalación de cualquier app que no venga de una tienda oficial —
eso no se puede evitar de ninguna forma sin inscribir cada teléfono en un sistema
empresarial de administración remota (Android Enterprise / MDM). Pero fuera de ese
único toque, todo lo demás es automático: tú nunca tienes que mandar el .apk por
WhatsApp ni pedirle a nadie que reinstale nada a mano.

1. Antes de compilar una nueva versión, sube el número en `app.js`, en la constante
   `CURRENT_VERSION` (por ejemplo de `'1.0.0'` a `'1.1.0'`).
2. Compílala, pruébala, y en GitHub crea una **Release** (menú lateral "Releases" →
   "Create a new release") adjuntando el `.apk` descargado del Action — eso te da un
   enlace de descarga permanente (los de la pestaña Actions caducan, los de una
   Release no).
3. En `admin.html`, baja hasta **"Publicar actualización de la app"**, pon el mismo
   número de versión, pega el enlace de la Release y, si quieres, una nota corta
   (ej. "Corrige el reporte de alimento"), y pulsa **"Publicar aviso de actualización"**.
4. Todos los teléfonos de todas las granjas revisan esto solos, una vez por hora.
   Cuando detectan una versión nueva, muestran un aviso amarillo en la pantalla
   principal con un botón **"⬇️ Descargar e instalar actualización"**. El usuario lo
   toca una vez, la app descarga el archivo sola y le abre a Android el instalador
   — Android le pide confirmar con un segundo toque ("Instalar" / "Actualizar"), y
   listo. Nunca tiene que buscar un archivo, ni saber qué es un APK.
   - La primera vez que un teléfono instale una actualización así, Android puede
     pedirle además activar **"Permitir desde esta fuente"** para la app (una sola
     vez por teléfono, luego no vuelve a preguntar).
   - El aviso desaparece solo para quien toque "Ya la tengo / recordar después".
   - Si por algún motivo el teléfono no tiene internet en ese momento, puede volver
     a intentarlo más tarde tocando el mismo botón otra vez.

**Para que las actualizaciones instalen ENCIMA de la app existente (sin que nadie
tenga que desinstalar antes)**, todas tus compilaciones deben firmarse siempre con
la misma firma. Esto ya está configurado en `build-apk.yml`, pero depende de que
exista el secreto `DEBUG_KEYSTORE_BASE64` en tu repositorio
(**Settings → Secrets and variables → Actions → New repository secret**), con el
contenido del archivo `debug.keystore.b64` que te entregué. Si ese secreto no
existe, cada compilación queda con una firma distinta y las actualizaciones
automáticas fallarán al instalar (Android las rechaza por seguridad) — en ese caso
sí haría falta desinstalar una vez. Guarda ese archivo en un lugar seguro: si lo
pierdes, la siguiente actualización pedirá desinstalar una última vez para poder
fijar una firma nueva.
