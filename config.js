// Configuração do site. Estes valores NÃO são segredos: o Firebase foi feito para
// expor a configuração web no navegador. A segurança vem das regras do Firestore
// (arquivo firestore.rules) e da chave do Gemini, que fica só na Vercel.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAveUlcXu4Ld9Fxpy4IqrRs9qUJFKioqRE",
  authDomain: "erafeiticeiros.firebaseapp.com",
  projectId: "erafeiticeiros",
  storageBucket: "erafeiticeiros.firebasestorage.app",
  messagingSenderId: "378847912261",
  appId: "1:378847912261:web:1b4995de38533352759e2c",
  measurementId: "G-LWZPC1HFDR"
};

// E-mail da conta Google do mestre (quem vê o Painel do mestre).
// Use o MESMO e-mail no arquivo firestore.rules.
window.ADMINS = ["bksapiens007@gmail.com"];

// Convite do Discord mostrado na lista de espera. Troque pelo link do seu servidor
// (ex.: "https://discord.gg/abc123"). Deixe "" para mostrar "Convite do Discord em breve".
window.DISCORD_CONVITE = "https://discord.gg/uGXfJSQm56";
