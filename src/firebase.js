import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, deleteToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyBdzqBzy-oon-iktPSwo5seOQ6MrbinoGw",
  authDomain: "chaewojido-17bdc.firebaseapp.com",
  projectId: "chaewojido-17bdc",
  storageBucket: "chaewojido-17bdc.firebasestorage.app",
  messagingSenderId: "613944690130",
  appId: "1:613944690130:web:d7dad17b42d5201eb1740b"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
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
      vapidKey: 'BBCxblDU3fA3WqBRNBvycJgshkS8DDCSHXZ68AXjBEruZjnuWJGbnl8SVA31wtBLQGHXBwaFO6kiD48nuM_T8iw'
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