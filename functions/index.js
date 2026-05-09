const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()

// 댓글 작성 시 알림
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

    // 기록 작성자 가져오기
    const recordSnap = await db
      .collection('teams').doc(teamId)
      .collection('records').doc(recordId)
      .get()

    if (!recordSnap.exists) return

    const record = recordSnap.data()
    const authorUid = record.authorUid

    // 댓글 작성자 본인이면 알림 안 보냄
    if (authorUid === comment.authorUid) return

    // 기록 작성자 FCM 토큰 가져오기
    const userSnap = await db.collection('users').doc(authorUid).get()
    if (!userSnap.exists) return

    const fcmToken = userSnap.data().fcmToken
    if (!fcmToken) return

    await messaging.send({
      token: fcmToken,
      notification: {
        title: '💬 새 댓글이 달렸어요!',
        body: `${comment.authorNickname}님이 댓글을 남겼어요: ${comment.text}`,
      },
    })
  }
)