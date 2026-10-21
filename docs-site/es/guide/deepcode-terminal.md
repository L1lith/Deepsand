---
title: Usando el terminal DeepCode
description: >-
  Cómo usar DeepCode CLI dentro de Deepsand, sus principales comandos de barra diagonal y atajos de
  teclado.
---

# Usando el terminal DeepCode

Deepsand ejecuta [DeepCode CLI](https://github.com/lessweb/deepcode-cli) dentro del entorno sandbox. La pestaña **Terminal** es una sesión DeepCode en vivo: escriba una solicitud en lenguaje normal o use uno de los comandos de barra diagonal de DeepCode para controlar la sesión.

No instala DeepCode en su propia máquina. Deepsand inicia CLI en el contenedor del proyecto, donde puede ver `/workspace` y los directorios que ha compartido.

Obtenga más información en [Página de inicio del proyecto DeepCode](https://deepcode.vegamo.cn/) o en [repositorio DeepCode](https://github.com/lessweb/deepcode-cli).

## Iniciar una sesión

1. Seleccione un proyecto en la barra lateral.
2. Presione **Correr**.
3. Espere a que se inicie la zona de pruebas. Si falta la imagen, Deepsand la compila primero y muestra el resultado de la compilación en **Actividad**.
4. El terminal DeepCode aparece cuando el CLI está listo.

Detener la caja de arena finaliza el contenedor. Al iniciar el proyecto nuevamente se reanuda la conversación DeepCode anterior, cuando exista.

## Pídele a DeepCode que haga algo.

Escriba una solicitud normal y presione **Ingresar**. Por ejemplo:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode puede leer y editar archivos en el espacio de trabajo, ejecutar comandos y utilizar las herramientas seleccionadas para el proyecto. Usted mantiene el control: cuando necesita algo fuera del espacio de trabajo, Deepsand pausa el entorno de pruebas y le pregunta a usted primero.

## Comandos de barra principal

Los comandos de barra diagonal comienzan con `/`. Al escribir `/` por sí solo se abre el menú de comandos.

| Comando | Qué hace |
| --- | --- |
| `/new` | Iniciar una nueva conversación |
| `/resume` | Elija una conversación anterior para continuar |
| `/fork` | Bifurca la conversación actual |
| `/continue` | Continúe la conversación activa o elija una para reanudarla |
| `/model` | Cambiar el modelo, el modo de pensar y el esfuerzo de razonamiento |
| `/raw` | Alternar el modo de visualización: desplazamiento hacia atrás Normal, Lite o Raw |
| `/init` | Cree un archivo `AGENTS.md` con instrucciones del proyecto |
| `/skills` | Enumere las habilidades disponibles para DeepCode |
| `/mcp` | Mostrar el estado del servidor MCP y las herramientas disponibles |
| `/undo` | Restaurar el código, la conversación o ambos a un punto anterior |
| `/exit` | Salir de DeepCode |

Es posible que un proyecto ya tenga un `AGENTS.md`; verifique antes de usar `/init` para no reemplazar las instrucciones que ya están allí.

## Atajos de teclado

| Clave | Acción |
| --- | --- |
| `Enter` | Enviar el aviso |
| `Shift+Enter` | Insertar una nueva línea |
| `Ctrl+J` | Insertar una nueva línea |
| `Esc` | Interrumpir el giro del modelo actual |
| `Ctrl+V` | Pegar una imagen cuando el modelo seleccionado admita imágenes |
| `Ctrl+D` dos veces | Salir de DeepCode |

Después de interrumpir un turno con `Esc`, puedes escribir otra solicitud. La zona de pruebas no se reinicia.

## Sesiones, modelos y deshacer

- `/new` comienza de nuevo con una conversación limpia. Los archivos del proyecto no se eliminan.
- `/resume` y `/continue` recuperan una conversación anterior.
- `/model` cambia el modelo, el modo de pensamiento y el esfuerzo de razonamiento de la sesión. El encabezado del proyecto también tiene un selector de modelo y un control deslizante de pensamiento; **Equilibrado** es el punto medio y la configuración recomendada para la mayoría de los trabajos.
- `/undo` restaura el código, la conversación o ambos a un punto anterior. Es la forma más rápida de echarse atrás en un cambio que no deseaba.

El historial de conversaciones se encuentra en el volumen de estado Deepsand del proyecto, no en su repositorio.

## Permisos y sandbox

La terminal está dentro del contenedor, por lo que ve el proyecto en `/workspace` y los directorios que compartió explícitamente, y nada más en su computadora.

Cuando DeepCode solicita otro directorio, un destino de red, una herramienta u otro recurso, Deepsand congela la zona de pruebas y muestra un cuadro de diálogo de permiso.

- **Conceder acceso** aplica la solicitud y reanuda la sesión.
- **Denegar** lo rechaza y le dice a DeepCode que la decisión es definitiva.
- Al aprobar un directorio se recrea el contenedor con el nuevo montaje.

Lea [Cómo funciona la caja de arena](./security) antes de compartir un directorio que contenga archivos confidenciales.

## Si el terminal no arranca

- **Falta la imagen:** Deepsand lo construye primero. Mire **Actividad** para conocer el progreso de la compilación.
- **Docker Desktop no se está ejecutando o está bloqueado:** arrancarlo y esperar a que el motor termine de arrancar. Si Docker Desktop está funcionando pero el motor no responde, reinicie Docker Desktop. Utilice el control **Reinicie Docker Desktop…** en la aplicación cuando Deepsand lo muestre. De lo contrario, en Windows, haga clic derecho en la ballena Docker en el área de notificación y elija **Reanudar**; en macOS utilice el icono de la barra de menú Docker; en Linux abra el menú **Solucionar problemas** de Docker Desktop. Al reiniciar Docker Desktop, se finalizan todos los contenedores de la máquina. Ver [las preguntas frecuentes sobre Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **La clave API falta o es rechazada:** abra **Ajustes** y guarde una clave válida.
- **DeepCode salió:** presione **Correr** nuevamente. La sesión anterior se puede reanudar con `/resume`.

## Páginas relacionadas

- [Empezando](./getting-started)
- [Obtenga una clave DeepSeek API](./deepseek-api)
- [Cómo funciona la caja de arena](./security)
- [Página de inicio del proyecto DeepCode](https://deepcode.vegamo.cn/)
