import { initializeApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, deleteToken, onMessage } from 'firebase/messaging'
import { getAnalytics, logEvent } from 'firebase/analytics'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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

let analytics = null
try { analytics = getAnalytics(app) } catch (_) {}
export const trackEvent = (name, params = {}) => {
  if (!analytics) return
  try { logEvent(analytics, name, params) } catch (_) {}
}

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

      // requestPermissions 전에 tokenReceived 리스너 등록.
      // Firebase가 APNs 토큰 → FCM 토큰 교환을 완료하면 즉시 이벤트 발생.
      // getToken()이 hang하는 경우를 방지하기 위해 이벤트 + 폴링 + 타임아웃을 race.
      let removeListener = null
      const tokenFromEvent = new Promise(resolve => {
        FirebaseMessaging.addListener('tokenReceived', e => resolve(e?.token || null))
          .then(handle => { removeListener = () => handle.remove().catch(() => {}) })
          .catch(() => resolve(null))
      })

      const { receive } = await FirebaseMessaging.requestPermissions()
      if (receive !== 'granted') {
        if (removeListener) removeListener()
        return null
      }

      // 폴링: 호출당 4초 타임아웃으로 hang 방지, 2초 간격 8회 재시도
      const pollToken = async () => {
        for (let i = 0; i < 8; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 2000))
          const t = await Promise.race([
            FirebaseMessaging.getToken().then(r => r?.token || null).catch(() => null),
            new Promise(r => setTimeout(() => r(null), 4000)),
          ])
          if (t) return t
        }
        return null
      }

      // tokenReceived 이벤트, 폴링, 15초 전체 타임아웃 중 가장 먼저 오는 결과 사용
      const token = await Promise.race([
        tokenFromEvent,
        pollToken(),
        new Promise(r => setTimeout(() => r(null), 15000)),
      ])
      if (removeListener) removeListener()

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
