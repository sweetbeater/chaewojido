const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()

const sendPush = async (messaging, token, title, body, data = {}) => {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
    })
  } catch (err) {
    console.error('FCM send error:', err)
  }
}

// 팀 기록 생성 시 다른 팀원들에게 알림
exports.onTeamRecordCreated = onDocumentCreated(
  {
    document: 'teams/{teamId}/records/{recordId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const db = getFirestore()
    const messaging = getMessaging()

    const record = event.data.data()
    const { teamId } = event.params
    const authorUid = record.authorUid
    if (!authorUid) return

    const teamSnap = await db.collection('teams').doc(teamId).get()
    if (!teamSnap.exists) return

    const members = teamSnap.data().members || []
    const others = members.filter(uid => uid !== authorUid)

    await Promise.all(others.map(async uid => {
      const snap = await db.collection('users').doc(uid).get()
      if (!snap.exists) return
      const token = snap.data().fcmToken
      if (!token) return
      await sendPush(
        messaging, token,
        '✍️ 새 기록이 올라왔어요!',
        `${record.authorNickname || '팀원'}님이 "${record.title}" 기록을 남겼어요`,
        { type: 'record', recordId: event.params.recordId, teamId }
      )
    }))
  }
)

// 팀 기록 수정 시 다른 팀원들에게 알림
exports.onTeamRecordUpdated = onDocumentUpdated(
  {
    document: 'teams/{teamId}/records/{recordId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()

    // 좋아요 변경만 있는 경우는 onLikeAdded에서 처리 → 제목/내용/날짜 변경만 감지
    const titleChanged = before.title !== after.title
    const contentChanged = before.content !== after.content
    const startChanged = before.travelStartDate?.toMillis?.() !== after.travelStartDate?.toMillis?.()
    const endChanged = before.travelEndDate?.toMillis?.() !== after.travelEndDate?.toMillis?.()
    if (!titleChanged && !contentChanged && !startChanged && !endChanged) return

    const db = getFirestore()
    const messaging = getMessaging()
    const authorUid = after.authorUid
    if (!authorUid) return

    const teamSnap = await db.collection('teams').doc(event.params.teamId).get()
    if (!teamSnap.exists) return

    const members = teamSnap.data().members || []
    const others = members.filter(uid => uid !== authorUid)

    await Promise.all(others.map(async uid => {
      const snap = await db.collection('users').doc(uid).get()
      if (!snap.exists) return
      const token = snap.data().fcmToken
      if (!token) return
      await sendPush(
        messaging, token,
        '✏️ 기록이 수정됐어요!',
        `${after.authorNickname || '팀원'}님이 "${after.title}" 기록을 수정했어요`,
        { type: 'record', recordId: event.params.recordId, teamId: event.params.teamId }
      )
    }))
  }
)

// 댓글 작성 시 알림 (댓글 작성자를 제외한 모든 팀원에게)
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
    const commenterUid = comment.authorUid

    const teamSnap = await db.collection('teams').doc(teamId).get()
    if (!teamSnap.exists) return

    const members = teamSnap.data().members || []
    const others = members.filter(uid => uid !== commenterUid)
    if (!others.length) return

    await Promise.all(others.map(async uid => {
      const snap = await db.collection('users').doc(uid).get()
      if (!snap.exists) return
      const fcmToken = snap.data().fcmToken
      if (!fcmToken) return
      await sendPush(
        messaging, fcmToken,
        '💬 새 댓글이 달렸어요!',
        `${comment.authorNickname || '팀원'}님이 댓글을 남겼어요: ${comment.text}`,
        { type: 'comment', recordId, teamId }
      )
    }))
  }
)

// 좋아요 시 알림 (좋아요 누른 사람을 제외한 모든 팀원에게)
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

    const teamSnap = await db.collection('teams').doc(event.params.teamId).get()
    if (!teamSnap.exists) return

    const members = teamSnap.data().members || []
    const others = members.filter(uid => uid !== newLikerUid)
    if (!others.length) return

    const likerSnap = await db.collection('users').doc(newLikerUid).get()
    const likerNickname = likerSnap.exists ? (likerSnap.data().nickname || '팀원') : '팀원'

    await Promise.all(others.map(async uid => {
      const snap = await db.collection('users').doc(uid).get()
      if (!snap.exists) return
      const fcmToken = snap.data().fcmToken
      if (!fcmToken) return
      await sendPush(
        messaging, fcmToken,
        '❤️ 좋아요가 달렸어요!',
        `${likerNickname}님이 "${record.title}"에 좋아요를 눌렀어요`,
        { type: 'like', recordId: event.params.recordId, teamId: event.params.teamId }
      )
    }))
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
