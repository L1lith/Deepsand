---
title: Preguntas frecuentes
description: Respuestas cortas sobre proyectos, permisos, datos y actualizaciones.
---

# Preguntas frecuentes

## ¿DeepCode ve mi directorio personal?

No. La zona de pruebas ve el directorio del proyecto en `/workspace` y los directorios que usted otorga explícitamente. El resto del sistema de archivos del host no está montado.

## ¿Qué sucede cuando apruebo una solicitud de directorio?

Deepsand agrega el directorio como una concesión, recrea el contenedor con el nuevo montaje adjunto y reanuda la sesión DeepCode. Un sandbox en ejecución no puede obtener un montaje de enlace sin volver a crearse.

## ¿Dónde se almacenan mis conversaciones?

El historial de conversaciones, las sesiones, los archivos adjuntos y las habilidades generadas se encuentran en un volumen Docker por proyecto. La carpeta del proyecto en el disco contiene solo su código y archivos.

Eliminar un proyecto de Deepsand no elimina ese volumen. Limpiar los datos DeepCode de un proyecto elimina el volumen pero deja la carpeta del proyecto intacta.

## ¿Dónde se almacenan las claves y los secretos API?

Los secretos se cifran en reposo con una clave que se encuentra en el almacén de claves del sistema operativo y se inyectan en el sandbox como variables de entorno solo cuando se inicia. La interfaz muestra nombres y longitudes, nunca los valores almacenados.

Las credenciales también se pueden heredar de la configuración de su host DeepCode. No se copian en la carpeta del proyecto.

## ¿Cada proyecto puede utilizar un modelo diferente?

Sí. Un proyecto puede heredar la configuración del host o anular el modelo, la URL base y las credenciales en su propia configuración. El selector de encabezado también puede elegir un modelo para el proyecto; **Aplazar la configuración** significa que el proyecto no fija uno.

## ¿Qué modelo debo utilizar para mantener bajos los costos?

Utilice un modelo flash para la mayoría de las tareas. Deepsand tiene como valor predeterminado `deepseek-v4-flash`, que es la opción más económica para la codificación, explicaciones y ediciones diarias. Reserve `deepseek-v4-pro` para trabajos donde el flash claramente tiene problemas o necesita su capacidad adicional, porque el modelo profesional cuesta más ejecutarlo.

Cambie de modelo desde la cabecera del proyecto o con `/model` en el terminal DeepCode. Si está probando Deepsand por primera vez, comience con flash y solo pase a pro cuando tenga una tarea que lo necesite.

## ¿Qué hace el control deslizante de pensamiento?

El control deslizante de pensamiento está al lado del selector de modelo en el encabezado del proyecto. Controla cuánto razonamiento hace el modelo antes de responder.

| Detener | Lo que significa |
| --- | --- |
| **Apagado** | No lo pienses antes de responder. El más rápido, pero el menos cuidadoso. |
| **Rápido** | Un poco de reflexión, para pequeñas ediciones bien especificadas. |
| **Equilibrado** | Pensamiento moderado. El punto medio y el valor predeterminado sensato para el trabajo real. |
| **Profundo** | Piense lo más que pueda el modelo. El más lento y el más caro. |
| **Por defecto** | Aplazar al anfitrión `settings.json`; si no dice nada, DeepCode vuelve a Equilibrado. |

Mantenga el control deslizante en **Equilibrado** para la mayoría de las tareas. Es la configuración intermedia y da buenos resultados sin tener que pagar por el razonamiento más lento y costoso en cada solicitud. Pase a **Profundo** sólo para problemas realmente difíciles y utilice **Apagado** o **Rápido** para ediciones pequeñas y predecibles.

## ¿Deepsand solo funciona con DeepSeek?

No. DeepSeek es el valor predeterminado porque es el modelo y el punto final con el que se envía Deepsand, pero Deepsand configura el DeepCode CLI con un nombre de modelo, una URL base y una clave API. Puede apuntarlo a otro proveedor que exponga un API al que CLI pueda llamar, comúnmente un punto final compatible con OpenAI.

Establezca la URL base y el modelo del proveedor en **Ajustes**, o en las credenciales propias de un proyecto, y almacene la clave API de ese proveedor en el mismo lugar. La política de red del sandbox también debe permitir el punto final del proveedor.

## ¿Qué pasa si Docker Desktop no se está ejecutando o ha dejado de responder?

Deepsand no puede iniciar un sandbox sin el motor Docker. Si Docker Desktop no está funcionando, enciéndalo y espere a que el motor termine de arrancar. Deepsand vuelve a comprobar cuando la ventana recupera el foco y la barra de estado ofrece un reintento.

A veces, Docker Desktop sigue funcionando pero su motor ha dejado de responder. Reiniciar Deepsand no soluciona eso; Es necesario reiniciar Docker Desktop.

- **Utilice el control en la aplicación cuando aparezca.** Si Deepsand detecta Docker Desktop, muestra **Reinicie Docker Desktop…** en la barra de estado o advertencia del terminal. Ese control reinicia el motor Docker, incluido el proceso WSL que utiliza en Windows, y espera hasta que un contenedor pueda iniciarse nuevamente.
- **Windows:** haga clic derecho en la ballena Docker en el área de notificación y elija **Reanudar**. Si falta esa opción, abra Docker Desktop, seleccione **Solucionar problemas** y luego **Reiniciar Docker Desktop**.
- **macOS:** haga clic en la ballena Docker en la barra de menú y elija **Reanudar**.
- **Linux:** abra el menú Docker Desktop, seleccione **Solucionar problemas** y luego **Reiniciar Docker Desktop**. Si usa Docker Engine en lugar de Docker Desktop, reinicie su servicio, por ejemplo `sudo systemctl restart docker`.

Al reiniciar Docker Desktop, se finalizan todos los contenedores de la máquina, incluidos los contenedores no relacionados con Deepsand. Deepsand ofrece el reinicio pero no lo hace automáticamente. Consulte [Documentación de solución de problemas de Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) para conocer el menú específico de la plataforma.

## ¿Puedo usar Deepsand sin acceso a Internet?

El modelo necesita su punto final. Con el modo de red `none`, solo se puede acceder a ese punto final a través del proxy Deepsand. Las instalaciones de paquetes y otros accesos a la red fallarán a menos que permita los hosts que necesitan.

## ¿Cómo actualizo Deepsand?

Abra **Ajustes**, luego **Actualizaciones** y busque una versión más reciente. Las versiones de lanzamiento descargan actualizaciones firmadas y reinician la aplicación después de instalar una. La instalación de una actualización detiene la ejecución de entornos sandbox.

## ¿Existe una interfaz de línea de comandos?

Sí. `deepsandctl` proporciona comandos sin cabeza como `doctor`, `plan`, `run`, `watch`, `requests` y `network`. La aplicación de escritorio y CLI comparten el mismo código de política en `deepsand-core`.

## ¿Cómo informo un problema de seguridad?

No abra una edición pública por un problema de seguridad. Comuníquese con los mantenedores de forma privada a través del canal de informes de seguridad del repositorio e incluya suficientes detalles para reproducir el problema.
