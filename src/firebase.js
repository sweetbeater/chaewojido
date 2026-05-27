import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, deleteToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Capacitor/WKWebView 환경에서 iframe 우회: initializeAuth + 명시적 persistence
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
})
export const storage = getStorage(app)
let messaging = null
try {
  messaging = getMessaging(app)
} catch (e) {
  console.warn('Firebase Messaging not available:', e)
}
export { messaging }

export const requestNotificationPermission = async (uid) => {
  if (!messaging) return null
  if (typeof Notification === 'undefined') return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    // service worker를 명시적으로 등록한 뒤 getToken에 전달 (iOS 호환)
    let swReg = null
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .catch(() => null)
      if (swReg) await navigator.serviceWorker.ready.catch(() => null)
    }

    const tokenOpts = {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    }
    if (swReg) tokenOpts.serviceWorkerRegistration = swReg

    const token = await getToken(messaging, tokenOpts)

    if (token && uid) {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true })
    }

    return token
  } catch (err) {
    console.error('알림 권한 오류:', err)
    return null
  }
}

export const disableNotifications = async (uid) => {
  if (messaging) {
    try { await deleteToken(messaging) } catch (_) {}
  }
  try {
    const { doc, updateDoc, deleteField } = await import('firebase/firestore')
    await updateDoc(doc(db, 'users', uid), { fcmToken: deleteField() })
  } catch (err) {
    console.error('알림 해제 오류:', err)
  }
}

export { onMessage }