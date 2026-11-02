// Configuração do site. Estes valores NÃO são segredos: o Firebase foi feito para
// expor a configuração web no navegador. A segurança vem das regras do Firestore
// (arquivo firestore.rules) e da chave do Gemini, que fica só na Vercel.
//
// 1) No console do Firebase: Configurações do projeto > Seus apps > App da Web > "Config".
//    Copie os valores para cá.
// 2) Em ADMINS, coloque o e-mail da conta Google do mestre (quem vê o Painel do mestre).
//    Use o MESMO e-mail no arquivo firestore.rules.

window.FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

window.ADMINS = ["seu-email@gmail.com"];
