---
title: Obtenga una clave DeepSeek API
description: >-
  Regístrese en la plataforma DeepSeek API, agregue crédito, cree una clave y guárdela de forma
  segura en Deepsand.
---

# Obtenga una clave DeepSeek API

Deepsand necesita un proveedor de modelo para alimentar el asistente. La configuración predeterminada utiliza DeepSeek. Esta página le explica cómo crear una cuenta, agregar crédito, crear una clave API y guardarla en Deepsand.

Si ya tiene una clave API de otro proveedor, pase a [Usa una clave que ya tienes](#use-a-key-you-already-have).

## Antes de comenzar

Necesitarás:

- Una dirección de correo electrónico o una cuenta de inicio de sesión compatible.
- Un método de pago para el crédito API.
- Unos minutos para crear la clave y pegarla en Deepsand.

El DeepSeek API se factura por separado del sitio web de chat y la aplicación móvil de DeepSeek. Agregar crédito en la plataforma API es lo que le permite al asistente realizar solicitudes.

## 1. Crea una cuenta DeepSeek

1. Abra el [Plataforma DeepSeek API](https://platform.deepseek.com/).
2. Seleccione **Inscribirse** o **Acceso**.
3. Cree una cuenta con su dirección de correo electrónico o utilice una de las opciones de inicio de sesión admitidas.
4. Verifica tu dirección de correo electrónico o número de teléfono si la plataforma te lo pide.

## 2. Agregar crédito

1. Inicie sesión en la plataforma API.
2. Abre la sección de facturación o recarga en el panel.
3. Agregue la cantidad de crédito que desea utilizar.
4. Completa el pago.

El uso de API se deduce de este saldo. La plataforma muestra el saldo actual, el uso y los precios. Comience con una pequeña cantidad mientras prueba Deepsand; puedes agregar más más tarde.

## 3. Cree una clave API

1. Abra la sección **Teclas API** de la plataforma.
2. Seleccione **Crear nueva clave API** o el botón equivalente.
3. Asigne a la clave un nombre que reconozca, como **Deepsand**.
4. Cree la clave y cópiela inmediatamente.

La clave normalmente se muestra sólo una vez. Trátelo como una contraseña: cualquiera que la tenga puede gastar el crédito en su cuenta.

## 4. Guarde la clave en Deepsand

1. Abra Deepsand.
2. Abra **Ajustes**.
3. Busque el campo **Tecla API** en las credenciales predeterminadas.
4. Pega la clave.
5. Seleccione **Guardar clave**.

Deepsand almacena la clave en el almacén de claves de su sistema operativo, no en su archivo de configuración. La ventana solo muestra los últimos cuatro caracteres después de guardar, por lo que puede confirmar que una clave está presente sin volver a exponerla.

La clave para toda la aplicación se utiliza cuando ni la configuración del host DeepCode ni un proyecto proporcionan su propia clave. Una clave a nivel de proyecto todavía tiene prioridad.

## Usa una clave que ya tienes

Si ya tiene una clave API, no necesita crear una cuenta DeepSeek.

- Para usarlo para cada proyecto, abra **Ajustes**, ingrese la clave en el campo **Tecla API** y guárdela.
- Para utilizar un punto final o modelo diferente, configure también la URL base y el modelo en **Ajustes** o en las propias credenciales del proyecto.
- Para conservar una clave solo para un proyecto, abra la configuración de ese proyecto e ingrésela allí.

El proveedor debe exponer un API al que DeepCode CLI pueda llamar. Si está utilizando un proveedor que no es de DeepSeek, ingrese su URL base y el nombre del modelo en lugar de los valores predeterminados de DeepSeek.

## Si algo no funciona

- **La clave es rechazada:** crea una nueva clave en la plataforma y reemplaza la almacenada.
- **El saldo está vacío:** agrega crédito a la cuenta API. Una suscripción de chat no financia automáticamente el uso de API.
- **El asistente no puede comunicarse con el proveedor:** verifique el modo de red y la lista de permitidos del proyecto. El punto final del modelo debe ser accesible.
- **Quieres eliminar la clave:** abra **Ajustes** y seleccione **Quitar clave**.

## Páginas relacionadas

- [Empezando](./getting-started)
- [¿Qué es Deepsand?](./what-is-deepsand)
- [Cómo funciona la caja de arena](./security)
