import { buildPushHTTPRequest } from '@pushforge/builder'

// Configure standard web-push keys based on environment variables
const vapidPublicKeyBase64 = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKeyBase64 = process.env.VAPID_PRIVATE_KEY || ''
const subject = process.env.NEXT_PUBLIC_APP_URL || 'mailto:admin@biskate.eu'

// Helper to convert standard VAPID base64url keys to JWK format for Web Crypto API
function base64urlToUint8Array(base64url: string) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
  // atob is globally available in Edge runtimes
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(array: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getVapidJWK() {
  if (!vapidPublicKeyBase64 || !vapidPrivateKeyBase64) return null;

  try {
    const pub = base64urlToUint8Array(vapidPublicKeyBase64);
    // Standard VAPID public key begins with 0x04 (uncompressed point format)
    const x = pub.slice(1, 33);
    const y = pub.slice(33, 65);
    const d = base64urlToUint8Array(vapidPrivateKeyBase64);

    return {
      kty: "EC",
      crv: "P-256",
      x: uint8ArrayToBase64Url(x),
      y: uint8ArrayToBase64Url(y),
      d: uint8ArrayToBase64Url(d)
    };
  } catch (error) {
    console.error("Failed to parse VAPID keys to JWK", error);
    return null;
  }
}

const privateJWK = getVapidJWK();

export const sendWebPush = async (subscription: any, payload: string) => {
  if (!privateJWK) {
    console.warn('⚠️ Push notification aborted: VAPID keys not configured in environment or invalid.')
    return false
  }

  try {
    // payload is passed as a string from existing codebase, parse it to pass to the builder
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      parsedPayload = { text: payload };
    }

    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK,
      subscription,
      message: {
        payload: parsedPayload,
        adminContact: subject,
      }
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body
    });

    if (response.status === 201) {
      return true;
    }

    if (response.status === 410 || response.status === 404) {
      // The subscription is no longer valid
      return 'expired';
    }

    console.error('❌ Error response from push service:', response.status, await response.text());
    return false;
  } catch (error: any) {
    console.error('❌ Error sending web push:', error)
    return false
  }
}
