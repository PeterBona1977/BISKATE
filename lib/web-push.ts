import webpush from 'web-push'

// Configure standard web-push keys based on environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const subject = process.env.NEXT_PUBLIC_APP_URL || 'mailto:admin@biskate.eu'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    subject,
    vapidPublicKey,
    vapidPrivateKey
  )
}

export const sendWebPush = async (subscription: any, payload: string) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️ Push notification aborted: VAPID keys not configured in environment.')
    return false
  }
  
  try {
    await webpush.sendNotification(subscription, payload)
    return true
  } catch (error: any) {
    console.error('❌ Error sending web push:', error)
    if (error.statusCode === 410 || error.statusCode === 404) {
      // The subscription is no longer valid
      return 'expired'
    }
    return false
  }
}

export default webpush
