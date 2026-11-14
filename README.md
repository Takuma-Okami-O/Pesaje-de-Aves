# Pesaje de Aves — Agroinversiones SAI-RAM, C.A

Desarrollado por Analista de sistemas Eber Romero

App Android 100 % offline para el formato FO-ENG-004 (Registro de pesaje de aves).
12 galpones → 4 corrales (A, B, C, D) → pesadas (cantidad de aves + peso total en kg; la app lo convierte y muestra en gramos).
Calcula promedio por corral y por galpón (promedio de los 4 corrales), compara con la
tabla de referencia (días 13 a 28) y exporta el Excel con el formato de la planilla.
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

1. En el teléfono de la segunda persona: pantalla principal → **⬇ Respaldo**. Se crea un archivo
   `Respaldo_PesajeAves_FECHA.json`; envíalo (WhatsApp, correo, Drive, Bluetooth) al teléfono principal.
2. En el teléfono principal: **🔗 Combinar datos de otro teléfono** → elige el archivo (puedes elegir varios).
   Los galpones nuevos se agregan; si un galpón tiene datos en ambos teléfonos la app pregunta cuál conservar.
   Los datos del teléfono principal nunca se borran por combinar.
3. Toca la tarjeta **Peso promedio de la granja** para ver el resumen por galpón.
   **Exportar todos a Excel** agrega una primera hoja "Resumen Granja" con los 12 galpones y el promedio de la granja.

Peso promedio de la granja = promedio simple de los promedios de los galpones con datos.
Conviene que cada persona pese galpones distintos: si el mismo galpón se carga en dos teléfonos hay que elegir uno.
