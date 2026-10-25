---
title: Empezando
description: Instale Deepsand, cree su primer proyecto y ejecute su zona de pruebas.
---

# Empezando

Deepsand le ayuda a trabajar con un asistente de codificación de IA en un proyecto real sin darle acceso a ese asistente al resto de su computadora. No es necesario comprender Docker ni la línea de comando para utilizar el flujo básico.

Si primero desea tener una visión más amplia, lea [¿Qué es Deepsand?](./what-is-deepsand).

## Requisitos

- Docker Desktop en Windows o macOS, o Docker Engine en Linux.
- Una computadora Windows, macOS o Linux. El [pagina de descargas](../download) detecta el sistema y enumera los instaladores coincidentes.
- No se necesita instalación de Node.js o Rust a menos que esté compilando Deepsand desde el código fuente.

Docker Desktop debe estar ejecutándose antes de que Deepsand pueda iniciar un entorno limitado. Si el demonio aún se está iniciando, la barra de estado lo indica y ofrece verificarlo nuevamente. Docker Desktop también puede estar ejecutándose pero no responde; Si Deepsand dice que el demonio no responde, reinicie Docker Desktop. Cuando Deepsand detecta Docker Desktop muestra un control **Reinicie Docker Desktop…**. Ver [qué hacer si Docker Desktop no se está ejecutando o ha dejado de responder](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Instalar

Abra el [Página de descargas Deepsand](../download). Detecta su sistema operativo y enumera los instaladores más recientes de Windows, macOS y Linux de la versión actual de GitHub. Elija el paquete para su computadora, instálelo y luego inicie Deepsand.

Si está desarrollando Deepsand, el repositorio README tiene los comandos source-build y hot-reload.

## Primera carrera

No necesita DeepCode instalado o configurado antes de usar Deepsand. Deepsand ejecuta DeepCode dentro del entorno sandbox y viene con valores predeterminados sensatos para el modelo y el punto final.

Lo único que necesitas es una clave modelo API. La siguiente sección explica cómo obtener una clave DeepSeek, o puede usar una clave de otro proveedor. Guárdalo en **Configuración → Tecla API**.

Si ya utiliza DeepCode CLI en esta computadora, Deepsand puede heredar el modelo, la URL base y la clave de su configuración DeepCode existente. Un proyecto también puede anular esas credenciales en su propia configuración.

## Obtenga una clave API

Deepsand necesita una clave API de un proveedor de modelos antes de que el asistente pueda ejecutarse.

- **Si no tienes uno:** sigue a [Obtenga una clave DeepSeek API](./deepseek-api). Le explica cómo crear una cuenta, agregar crédito, crear una clave y regresar a Deepsand.
- **Si ya tienes uno:** abra **Ajustes**, péguelo en el campo **Tecla API** y seleccione **Guardar clave**.
- **Si desea una clave específica del proyecto:** abra la configuración de ese proyecto e ingréselo allí.

La clave de toda la aplicación se guarda en el almacén de claves de su sistema operativo, no en el archivo de estado de Deepsand. La ventana solo muestra los últimos cuatro caracteres después de guardar.

## Crear un proyecto

1. Seleccione **Nuevo proyecto** en la barra lateral.
2. Dale un nombre al proyecto.
3. Elija el directorio de trabajo.
4. Crea el proyecto.

El directorio de trabajo se convierte en `/workspace` dentro del sandbox. Deepsand rechaza rutas como la raíz del sistema de archivos, su directorio de inicio, almacenes de credenciales y su propio directorio de datos.

## Elige un modelo

Utilice un **modelo flash** para la mayoría de las tareas. Deepsand por defecto es `deepseek-v4-flash`, que es la opción más económica para codificación, explicaciones y ediciones diarias. Cambie a `deepseek-v4-pro` solo cuando Flash claramente tenga dificultades con una tarea; el modelo profesional cuesta más de ejecutar.

Puedes cambiar el modelo en **Ajustes**, desde la cabecera del proyecto, o con `/model` en el terminal DeepCode.

## Elige un nivel de pensamiento

El control deslizante de pensamiento está al lado del selector de modelo en el encabezado del proyecto. Controla cuánto razonamiento hace el modelo antes de responder.

- **Apagado:** sin pensar. El más rápido, pero el menos cuidadoso.
- **Rápido:** un poco de reflexión, para pequeñas ediciones bien especificadas.
- **Equilibrado:** pensamiento moderado y parada media. Este es el valor predeterminado sensato para el trabajo real.
- **Profundo:** razonamiento máximo. El más lento y el más caro.
- **Por defecto:** difiere al host `settings.json`; si no dice nada, DeepCode vuelve a Equilibrado.

Mantenga el control deslizante en **Equilibrado** para la mayoría de las tareas. Da buenos resultados sin tener que pagar por el razonamiento más lento y costoso en cada solicitud. Utilice **Profundo** sólo para problemas realmente difíciles y **Apagado** o **Rápido** para ediciones pequeñas y predecibles.

## ejecutar un proyecto

1. Seleccione el proyecto.
2. Presione **Correr**.
3. Si falta la imagen, Deepsand la compila primero y muestra el resultado de la compilación en la pestaña Actividad.
4. El DeepCode CLI comienza dentro del contenedor y aparece en la terminal.

Detener la caja de arena finaliza el contenedor. Al iniciarlo de nuevo, se reanuda la sesión DeepCode anterior, cuando exista una.

## Usando el terminal DeepCode

La pestaña **Terminal** es la sesión DeepCode CLI en vivo. Escriba una solicitud y presione **Ingresar**, o use un comando de barra diagonal para controlar la sesión. `/new` inicia una nueva conversación, `/resume` continúa una anterior, `/model` cambia el modelo y `/` abre el menú de comandos.

Lea [Usando el terminal DeepCode](./deepcode-terminal) para conocer los comandos principales, los atajos de teclado y los pasos de recuperación.

## Responder solicitudes de permiso

Cuando DeepCode necesita un directorio, un destino de red, una herramienta u otro recurso, Deepsand pausa el sandbox y muestra la solicitud.

- **Conceder acceso** permite la solicitud y reanuda la sesión.
- **Ahora no** lo rechaza esta vez; El modelo puede volver a preguntar más tarde.
- **no vuelvas a preguntar** lo rechaza, y Deepsand luego rechaza esa ruta (y todo lo que hay debajo de ella) o ese host (y sus subdominios), no solo con palabras. Cada bloque aparece en Permisos, donde puedes eliminarlo nuevamente.
- Una concesión de directorio recrea el contenedor con el nuevo montaje adjunto.

Lea [Cómo funciona la caja de arena](./security) antes de otorgar acceso a un directorio que contenga archivos confidenciales.

## donde encontrar cosas

| Área | Lo que muestra |
| --- | --- |
| Terminales | La sesión DeepCode en vivo dentro del sandbox. |
| Permisos | Directorios compartidos, la lista de permitidos de la red y la pista de auditoría. |
| Herramientas | Herramientas integradas en la imagen del proyecto, capacidades agrupadas, idiomas, administradores de paquetes, utilidades, ingeniería inversa. No hay nada activado de forma predeterminada y al cambiar la selección se reconstruye la imagen. |
| Secretos | Valores cifrados inyectados como variables de entorno al inicio. |
| Actividad | Los argumentos exactos de `docker run`, el registro de compilación y los intentos de salida bloqueados. |

## Próximos pasos

- [Cómo funciona la caja de arena](./security)
- [Preguntas frecuentes](./faq)
