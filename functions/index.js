const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()

const sendPush = async (messaging, token, title, body) => {
  try {
    await messaging.send({ token, notification: { title, body } })
  } catch (err) {
    console.error('FCM send error:', err)
  }
}

// 댓글 작성 시 알림 (기록 작성자에게)
exports.onCommentCreated = onDocumentCreated(
  {
    document: 'teams/{teamId}/records/{recordId}/comments/{commentId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const db = getFirestore()
    const messaging = getMessaging()

    const comment = event.data.data()
    const { teamId, recordId } = event.params

    const recordSnap = await db
      .collection('teams').doc(teamId)
      .collection('records').doc(recordId)
      .get()

    if (!recordSnap.exists) return

    const record = recordSnap.data()
    const authorUid = record.authorUid
    if (authorUid === comment.authorUid) return

    const userSnap = await db.collection('users').doc(authorUid).get()
    if (!userSnap.exists) return

    const fcmToken = userSnap.data().fcmToken
    if (!fcmToken) return

    await sendPush(
      messaging, fcmToken,
      '💬 새 댓글이 달렸어요!',
      `${comment.authorNickname}님이 댓글을 남겼어요: ${comment.text}`
    )
  }
)

// 좋아요 시 알림 (기록 작성자에게)
exports.onLikeAdded = onDocumentUpdated(
  {
    document: 'teams/{teamId}/records/{recordId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const db = getFirestore()
    const messaging = getMessaging()

    const beforeLikes = event.data.before.data().likes || []
    const afterLikes = event.data.after.data().likes || []
    const newLikerUid = afterLikes.find(uid => !beforeLikes.includes(uid))
    if (!newLikerUid) return

    const record = event.data.after.data()
    const authorUid = record.authorUid
    if (!authorUid || authorUid === newLikerUid) return

    const [authorSnap, likerSnap] = await Promise.all([
      db.collection('users').doc(authorUid).get(),
      db.collection('users').doc(newLikerUid).get(),
    ])
    if (!authorSnap.exists) return

    const fcmToken = authorSnap.data().fcmToken
    if (!fcmToken) return

    const likerNickname = likerSnap.exists ? (likerSnap.data().nickname || '팀원') : '팀원'

    await sendPush(
      messaging, fcmToken,
      '❤️ 좋아요를 받았어요!',
      `${likerNickname}님이 "${record.title}"에 좋아요를 눌렀어요`
    )
  }
)

// 새 팀원 참여 시 기존 팀원들에게 알림
exports.onTeamMemberJoined = onDocumentUpdated(
  {
    document: 'teams/{teamId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()
    const beforeMembers = before.members || []
    const afterMembers = after.members || []
    const newMemberUid = afterMembers.find(uid => !beforeMembers.includes(uid))
    if (!newMemberUid) return

    const db = getFirestore()
    const messaging = getMessaging()

    const newMemberSnap = await db.collection('users').doc(newMemberUid).get()
    const newMemberNickname = newMemberSnap.exists
      ? (newMemberSnap.data().nickname || '새 팀원')
      : '새 팀원'

    const existingMembers = beforeMembers.filter(uid => uid !== newMemberUid)
    await Promise.all(existingMembers.map(async uid => {
      const snap = await db.collection('users').doc(uid).get()
      if (!snap.exists) return
      const token = snap.data().fcmToken
      if (!token) return
      await sendPush(
        messaging, token,
        '👥 새 팀원이 생겼어요!',
        `${newMemberNickname}님이 ${after.name} 팀에 참여했어요`
      )
    }))
  }
)
