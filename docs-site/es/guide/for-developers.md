---
title: Debajo del capó
description: >-
  Arquitectura, aislamiento, flujo de permisos, redes y herramientas de línea de comandos detrás de
  Deepsand.
---

# Debajo del capó

Esta página es para desarrolladores que desean conocer la forma técnica del sistema. Si busca una explicación en lenguaje sencillo, comience con [¿Qué es Deepsand?](./what-is-deepsand).

## Arquitectura

Deepsand es una aplicación de escritorio Tauri con tres capas principales:

- **la ventana** es una interfaz SolidJS. Representa estado y envía intenciones; no decide la política.
- **La capa Tauri** expone comandos de escritorio y traduce la misma superficie de comandos a un servidor HTTP de bucle invertido para clientes remotos.
- **`deepsand-core`** es dueño de las reglas. La validación de ruta, el plan `docker run`, el agente de permisos, el proxy de salida, el almacén de secretos cifrados y el almacén de estado se encuentran allí.

La aplicación de escritorio y el controlador de línea de comandos `deepsandctl` usan el mismo núcleo, por lo que no pueden separarse en una decisión de seguridad.

## Un proyecto, un contenedor

Cada proyecto obtiene su propio contenedor Docker y su propio volumen de estado. El directorio del proyecto está montado en `/workspace`; otros directorios de host requieren concesiones explícitas.

`policy::plan_run` construye el argv `docker run` completo en un solo lugar. La pestaña Actividad muestra ese plan exacto, incluidos los montajes, las capacidades, el modo de red y las rutas de solo lectura.

El contenedor está deliberadamente restringido:

- El sistema de archivos raíz es de solo lectura, con montajes tmpfs de tamaño para `/tmp` y `/run`.
- El spool de respuesta y el directorio de estado están montados como de solo lectura.
- Los sockets de tiempo de ejecución de contenedor se rechazan por su nombre.
- Las capacidades se eliminan antes de que se ejecute DeepCode y se establezca `no-new-privileges`.
- Los sockets de tiempo de ejecución de contenedores y otros montajes prohibidos no se cierran en lugar de producir un plan más débil.

## Permisos

El sandbox puede solicitar más acceso, pero no puede concedérselo. Una solicitud de permiso se escribe en un spool; el intermediario host lo valida y pausa el contenedor. El operador ve la solicitud y decide.

Al aprobar una solicitud de directorio se vuelve a crear el contenedor con el nuevo montaje de enlace y se reanuda la sesión. Un rechazo es una de dos respuestas, y se le dice al modelo cuál: **no vuelvas a preguntar** es definitiva, mientras que **Ahora no** rechaza esta vez y dice que el modelo puede volver a preguntar más tarde. Un rechazo final se almacena en el proyecto y el host lo aplica: nunca se crea ningún montaje para la ruta ni nada debajo de él, y un host rechazado se convierte en una regla de denegación que cubre sus subdominios. Los bloqueos se enumeran en Permisos y pueden eliminarse allí, porque una decisión sin vuelta atrás es una trampa más que una elección.

Una solicitud de algo que ya tiene el sandbox se rechaza con una explicación. No existe una ruta de aprobación automática, porque una aprobación silenciosa sería un consentimiento que el operador nunca dio.

## Redes

La política de red tiene cuatro modos:

| Modo | Comportamiento |
| --- | --- |
| `none` | Solo el punto final del modelo a través del proxy de salida Deepsand. |
| `allowlisted` | El punto final del modelo, el proxy y los hosts, direcciones y puertos nombrados. |
| `internet` | Acceso a Internet, con rangos locales y privados bloqueados dentro del contenedor. |
| `full` | Acceso a Internet sin el bloqueo de la red local. |

El proxy resuelve una entrada de nombre de host y rechaza resultados privados, de bucle invertido, de enlace local y reservados. El contenedor aplica directamente una entrada de dirección, que es lo que permite que un cliente de base de datos u otro programa que no sea HTTP se conecte. Un puerto con nombre se publica únicamente en el loopback del host.

## Secretos y actualizaciones

Los secretos se cifran en reposo con una clave que se encuentra en el almacén de claves del sistema operativo. Se pasan al contenedor a través de un archivo de entorno, nunca como un valor de línea de comando, y se inyectan solo cuando se inicia el entorno limitado.

Las versiones de lanzamiento verifican las actualizaciones firmadas antes de instalarlas. La clave de firma nunca se almacena en el repositorio.

## línea de comando

`deepsandctl` proporciona la superficie sin cabeza:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` imprime el argv `docker run` exacto sin iniciar un contenedor, lo cual es útil para revisar una política modificada.

## Leer más

- [El modelo de seguridad total](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Notas de arquitectura](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Cómo funciona la caja de arena](./security)
