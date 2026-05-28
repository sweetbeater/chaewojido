importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyBdzqBzy-oon-iktPSwo5seOQ6MrbinoGw",
  authDomain: "chaewojido-17bdc.firebaseapp.com",
  projectId: "chaewojido-17bdc",
  storageBucket: "chaewojido-17bdc.firebasestorage.app",
  messagingSenderId: "613944690130",
  appId: "1:613944690130:web:d7dad17b42d5201eb1740b"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/삐야_아이콘.png',
    badge: '/삐야_아이콘.png',
  })
})
