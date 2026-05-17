# Configuración de Firebase para ToolVault

Las credenciales ya están en **`firebase-config.js`**. La aplicación actualmente usa **localStorage** del navegador como base de datos (ideal para prototipar). Para conectarla a Firebase en producción, sigue estos pasos.

## ⚠️ Importante sobre seguridad

La `apiKey` del Web SDK de Firebase **no es secreta** — sirve para identificar el proyecto, no para autorizar. La seguridad real se aplica con:

1. **Reglas de seguridad** de Firestore / Realtime Database / Storage
2. **Authentication** habilitado y obligatorio
3. **Dominios autorizados** (consola → Authentication → Settings → Authorized domains)

## 1. Habilitar productos en la consola

En [console.firebase.google.com](https://console.firebase.google.com) → proyecto `abbtest`:

- **Authentication** → Sign-in method → activar **Email/Password** (lo usamos internamente, el usuario no ve el correo)
- **Firestore Database** → crear base de datos en modo **Producción**
- **Storage** → crear bucket (para imágenes de herramientas y PDFs de certificados)

## 2. Estrategia de Auth sin pedir correo

Firebase Auth requiere email, pero el usuario solo entrega usuario + clave. Solución: convertir internamente el username a un email sintético:

```js
const syntheticEmail = (username) => `${username.toLowerCase()}@toolvault.local`;
// Login:    auth.signInWithEmailAndPassword(syntheticEmail(u), pwd)
// Registro: auth.createUserWithEmailAndPassword(syntheticEmail(u), pwd)
```

El nombre real y el rol se guardan en el documento `users/{uid}` de Firestore.

## 3. Estructura sugerida en Firestore

```
config/main           — { orgName, logoUrl }
users/{uid}           — { name, username, role, createdAt }
tools/{toolId}        — { name, location, status, observations,
                          certDue, certIssued, currentCertId,
                          currentUser, useStarted,
                          imgPath, createdBy, createdAt,
                          updatedBy, updatedAt }
certs/{certId}        — { toolId, uploadedAt, uploadedBy, dueDate,
                          issuedDate, filename, storagePath, status }
events/{eventId}      — { toolId, type, userId, at, detail }
```

## 4. Reglas de seguridad mínimas (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cualquier usuario autenticado puede leer todo
    match /{document=**} {
      allow read: if request.auth != null;
    }
    // Solo autenticados pueden crear
    match /tools/{id} {
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    match /events/{id} {
      allow create: if request.auth != null;
      allow update, delete: if false; // historial inmutable
    }
    match /certs/{id} {
      allow create, update: if request.auth != null;
      allow delete: if false; // los certificados anteriores nunca se borran
    }
    match /users/{uid} {
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid;
    }
  }
}
```

## 5. Reglas de Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tools/{toolId}/{file=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                    && request.resource.size < 10 * 1024 * 1024  // 10 MB
                    && request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

## 6. Hosting

Para servir desde GitHub Pages, agregar el dominio `<usuario>.github.io` en **Authentication → Settings → Authorized domains**.

## 7. Activar Firebase en la app

Cuando estés listo:

1. Crear `firebase-store.js` que reemplace las funciones `TV.loadDB` / `TV.saveDB` con llamadas a Firestore
2. Agregar el SDK en `index.html`:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-storage-compat.js"></script>
   <script src="firebase-config.js"></script>
   <script src="firebase-store.js"></script>
   ```
3. Migrar imágenes y PDFs de data-URL a referencias de Storage (`storagePath`) para no exceder el límite de 1 MB por documento de Firestore.

## 8. Test rápido sin SDK

Puedes probar la conexión a Realtime Database con un simple fetch:

```js
fetch("https://abbtest-default-rtdb.firebaseio.com/test.json", {
  method: "PUT", body: JSON.stringify({ hola: "mundo" })
}).then(r => r.json()).then(console.log);
```

(Necesita reglas RTDB permisivas durante pruebas.)
