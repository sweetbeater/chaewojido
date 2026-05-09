import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

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
export const db = getFirestore(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app)

export const requestNotificationPermission = async (uid) => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: 'BBCxblDU3fA3WqBRNBvycJgshkS8DDCSHXZ68AXjBEruZjnuWJGbnl8SVA31wtBLQGHXBwaFO6kiD48nuM_T8iw'
    })

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

export { onMessage }