import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, deleteToken, onMessage } from 'firebase/messaging'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

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

// 웹 전용: Firebase Web Messaging (서비스 워커 기반)
let messaging = null
if (!isNative) {
  try {
    messaging = getMessaging(app)
  } catch (e) {
    console.warn('Firebase Messaging not available:', e)
  }
}
export { messaging }

export const requestNotificationPermission = async (uid) => {
  if (isNative) {
    // 네이티브 iOS: @capacitor-firebase/messaging 사용
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')
      // iOS 설정에서 차단된 경우 즉시 감지
      const { receive: current } = await FirebaseMessaging.checkPermissions()
      if (current === 'denied') return 'denied'
      const { receive } = await FirebaseMessaging.requestPermissions()
      if (receive !== 'granted') return null

      // requestPermissions()가 내부적으로 registerForRemoteNotifications()를 호출하지만
      // APNs 콜백(didRegisterForRemoteNotificationsWithDeviceToken)은 비동기로 도착함.
      // Firebase SDK가 APNs 토큰을 받기 전에 getToken()을 호출하면 실패하므로 재시도.
      let token = null
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500))
        try {
          const result = await FirebaseMessaging.getToken()
          token = result?.token || null
          if (token) break
        } catch (e) {
          console.warn(`FCM getToken 시도 ${attempt + 1} 실패:`, e?.message)
        }
      }

      if (token && uid) {
        const { doc, setDoc } = await import('firebase/firestore')
        await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true })
        localStorage.removeItem('notifDisabled')
      }
      return token
    } catch (err) {
      console.error('알림 권한 오류:', err)
      return null
    }
  }

  // 웹: 서비스 워커 기반 Firebase Web Messaging
  if (!messaging) return null
  if (typeof Notification === 'undefined') return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    let swReg = null
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => null)
      if (swReg) await navigator.serviceWorker.ready.catch(() => null)
    }

    const tokenOpts = { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY }
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
  if (isNative) {
    // 네이티브: deleteToken 후 getToken이 iOS에서 신뢰성 없음 → 디바이스 토큰 유지, Firestore만 제거
    localStorage.setItem('notifDisabled', '1')
  } else if (messaging) {
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
