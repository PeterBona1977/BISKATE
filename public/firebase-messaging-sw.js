// Firebase Messaging Service Worker
// Este arquivo deve estar na pasta public/ para ser acessível

importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

// Configuração do Firebase (será preenchida dinamicamente)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

// Inicializar Firebase
const firebase = self.firebase
firebase.initializeApp(firebaseConfig)

// Obter instância do messaging
const messaging = firebase.messaging()

// Manipular mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log("Mensagem recebida em background:", payload)

  const notificationTitle = payload.notification?.title || "Nova notificação"
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/logo.png",
    badge: "/badge.png",
    data: payload.data || {},
    actions: [
      {
        action: "open",
        title: "Abrir",
      },
      {
        action: "close",
        title: "Fechar",
      },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Manipular cliques na notificação
self.addEventListener("notificationclick", (event) => {
  console.log("Clique na notificação:", event)

  event.notification.close()

  if (event.action === "open" || !event.action) {
    // Abrir ou focar na janela da aplicação
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("biskate") && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/dashboard")
        }
      }),
    )
  }
})
