/* ToolVault — Firebase initialization
   Expone fbAuth, fbDB, fbStorage como globales.
   Carga ANTES de cualquier script Babel.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyC7vFbNDCSeNTq-GCwCGo4q0qc5VQoCSjo",
  authDomain: "abbtest.firebaseapp.com",
  databaseURL: "https://abbtest-default-rtdb.firebaseio.com",
  projectId: "abbtest",
  storageBucket: "abbtest.firebasestorage.app",
  messagingSenderId: "949838452104",
  appId: "1:949838452104:web:b8009937379748c0b6d63d",
  measurementId: "G-GY520FDQT9",
};

firebase.initializeApp(firebaseConfig);

window.fbAuth    = firebase.auth();
window.fbDB      = firebase.firestore();
window.fbStorage = firebase.storage();

// Persistencia de sesión entre recargas (Firebase maneja la cookie)
fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Username → email interno (el usuario nunca lo ve)
window.usernameToEmail = (username) =>
  `${username.toLowerCase().trim()}@abbtoolvault.internal`;

console.log("[ToolVault] Firebase inicializado →", firebaseConfig.projectId);
