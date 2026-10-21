---
title: Cómo funciona la caja de arena
description: Lo que Deepsand aplica, lo que usted decide y lo que el sandbox no puede alcanzar.
---

# Cómo funciona la caja de arena

En términos sencillos: el asistente puede trabajar en el proyecto que usted elija y en las carpetas que usted apruebe, y en ningún otro lugar de su computadora.

La promesa de Deepsand es limitada y comprobable: la zona de pruebas puede llegar al directorio del proyecto y a los directorios que usted otorga explícitamente, y nada más.

## El límite

El contenedor no tiene otra vista del sistema de archivos del host que los montajes de enlace que eligió Deepsand. Otras rutas de host no existen dentro del espacio de nombres de montaje del contenedor, por lo que no hay ningún archivo de host al que escapar.

Todo lo demás que se describe aquí es defensa en profundidad por encima de ese límite.

## lo que se aplica

- Desde el host solo se montan el espacio de trabajo y las concesiones explícitas.
- El spool de respuesta y el directorio de estado están montados como de solo lectura.
- Los sockets de tiempo de ejecución de contenedor se rechazan por su nombre.
- El sistema de archivos raíz del contenedor es de solo lectura, con sistemas de archivos temporales de tamaño para `/tmp` y `/run`.
- Los enlaces simbólicos se resuelven antes de comprobar una ruta, por lo que un enlace no puede ocultar un destino prohibido.
- Los privilegios se eliminan antes de que se ejecute DeepCode y `no-new-privileges` impide que se recuperen.

## Modos de red

| Modo | Qué permite |
| --- | --- |
| Ninguno | Solo el punto final del modelo a través del proxy Deepsand. |
| Listado permitido | El punto final del modelo, el proxy y los hosts o direcciones en la lista de permitidos. |
| Internet | Acceso a Internet, con rangos locales y privados bloqueados dentro del contenedor. |
| Completo | Acceso a Internet sin el bloqueo de la red local. Úselo sólo cuando el sandbox realmente necesite su red local. |

Un nombre de host incluido en la lista permitida pasa por el proxy, que resuelve el nombre por sí mismo y rechaza un resultado en un espacio de direcciones privado. Las reglas del contenedor permiten directamente una dirección incluida en la lista de permitidos, porque un cliente de base de datos u otro programa que no sea HTTP no puede usar el proxy. Un puerto nombrado en una entrada también se publica en el loopback del host, nunca en todas las interfaces.

## lo que tu decidas

Deepsand nunca otorga acceso automáticamente. Le llega una solicitud con la ruta, el host, la herramienta o el recurso que solicita y el entorno de pruebas permanece en pausa hasta que usted decida.

Una solicitud para algo que el entorno de pruebas ya tiene se rechaza con una explicación, porque una autorización automática sería un consentimiento que usted nunca dio. Cualquier cosa ambigua te llega.

## Contra qué no protege

- El proveedor del modelo puede ver el contenido que le envía.
- Los archivos que coloque en el espacio de trabajo son visibles en la zona de pruebas y pueden modificarse o eliminarse.
- Una herramienta o instrucción de modelo con formato incorrecto aún puede solicitar acceso. La decisión sigue siendo tuya.
- El propio Docker está fuera del límite. Mantenga actualizado Docker Desktop y el sistema operativo del host.

## Leer más

El modelo de seguridad completo, incluidas las pruebas que afirman cada propiedad, se encuentra en [documentos/SEGURIDAD.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

La arquitectura se describe en [docs/ARQUITECTURA.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).
