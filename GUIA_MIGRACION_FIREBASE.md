# 🚀 Guía Exhaustiva: Migración de Swapit a Firebase

Esta guía te ayudará a configurar tu propio backend en la nube para que **Swapit** funcione de forma real, permitiendo que varios usuarios se conecten desde distintos teléfonos, suban artículos y chateen entre ellos.

---

## Paso 1: Crear tu Proyecto en Firebase

1.  Ve a [Firebase Console](https://console.firebase.google.com/).
2.  Inicia sesión con tu cuenta de Google.
3.  Haz clic en **"Añadir proyecto"**.
4.  Ponle un nombre (ejemplo: `Swapit-Real`).
5.  Desactiva "Google Analytics" por ahora para simplificar (puedes activarlo después).
6.  Haz clic en **"Crear proyecto"** y espera a que termine.

---

## Paso 2: Configurar la Autenticación (Usuarios)

Esto permitirá que la gente se registre y entre con su email o cuenta de Google.

1.  En el menú de la izquierda, ve a **"Build"** (Compilación) > **"Authentication"**.
2.  Haz clic en **"Comenzar"**.
3.  En la pestaña **"Sign-in method"** (Método de inicio de sesión):
    *   **Correo electrónico/Contraseña:** Haz clic, actívalo y guarda.
    *   **Google:** Haz clic, actívalo, selecciona tu email de soporte y guarda.

---

## Paso 3: Configurar la Base de Datos (Firestore)

Aquí se guardarán los artículos, los chats y los matches.

1.  En el menú de la izquierda, ve a **"Build"** > **"Firestore Database"**.
2.  Haz clic en **"Crear base de datos"**.
3.  Selecciona una ubicación (ejemplo: `europe-west` si estás en España).
4.  **IMPORTANTE:** Selecciona **"Comenzar en modo de prueba"**. Esto permitirá leer y escribir datos durante los primeros 30 días mientras probamos.
5.  Haz clic en **"Habilitar"**.

---

## Paso 4: Configurar el Almacenamiento de Imágenes (Storage)

Aquí se guardarán las fotos que los usuarios suban de sus artículos.

1.  En el menú de la izquierda, ve a **"Build"** > **"Storage"**.
2.  Haz clic en **"Comenzar"**.
3.  Selecciona **"Comenzar en modo de prueba"**.
4.  Haz clic en **"Siguiente"** y luego en **"Listo"**.

---

## Paso 5: Obtener tus Claves de Configuración

Para que la aplicación sepa a qué base de datos conectarse, necesitamos unas claves.

1.  Haz clic en el icono de engranaje (⚙️) al lado de "Project Overview" y selecciona **"Configuración del proyecto"**.
2.  En la pestaña **"General"**, baja hasta "Tus aplicaciones".
3.  Haz clic en el icono de **Web** (`</>`).
4.  Ponle un nombre a la app (ejemplo: `Swapit Web`).
5.  Haz clic en **"Registrar aplicación"**.
6.  Te aparecerá un código llamado `firebaseConfig`. Se ve algo así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abcde"
};
```

---

## Paso 6: ¿Qué debes hacer ahora?

Una vez tengas ese código `firebaseConfig`, **pásamelo por aquí**. 

**Yo me encargaré de:**
1.  Instalar las librerías necesarias en el código.
2.  Reemplazar el sistema de `localStorage` por llamadas reales a tu base de datos de Firebase.
3.  Configurar el sistema para que las imágenes se suban a tu Storage.

### ¿Cómo probarlo en varios móviles?
Una vez que yo termine la migración:
1.  Te daré una URL (el "App URL" que ves arriba).
2.  Podrás abrir esa URL en cualquier teléfono móvil.
3.  Crea una cuenta en un teléfono y otra cuenta en otro teléfono (o usa el modo incógnito).
4.  ¡Verás cómo los artículos que subes en uno aparecen instantáneamente en el otro!

---

**Nota de seguridad:** Al usar el "Modo de prueba", tus datos son accesibles por cualquiera que sepa la URL de tu base de datos. Una vez terminemos las pruebas, te enseñaré a poner "Reglas de Seguridad" para proteger la información.
