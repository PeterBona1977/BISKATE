import { SignJWT, importPKCS8 } from 'jose';

export interface FCMServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

export class FCMEdgeClient {
    private static accessToken: string | null = null;
    private static tokenExpiry: number = 0;

    /**
     * Exchanges Service Account credentials for a short-lived Google OAuth2 Access Token.
     * Compatible with Cloudflare Edge Runtime.
     */
    static async getAccessToken(serviceAccount: FCMServiceAccount): Promise<string> {
        // Return cached token if still valid (minus 30s buffer)
        if (this.accessToken && Date.now() < this.tokenExpiry - 30000) {
            return this.accessToken;
        }

        try {
            const algorithm = 'RS256';
            const privateKey = await importPKCS8(serviceAccount.private_key, algorithm);

            const jwt = await new SignJWT({
                scope: 'https://www.googleapis.com/auth/firebase.messaging'
            })
                .setProtectedHeader({ alg: algorithm })
                .setIssuer(serviceAccount.client_email)
                .setAudience('https://oauth2.googleapis.com/token')
                .setExpirationTime('1h')
                .setIssuedAt()
                .sign(privateKey);

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to fetch access token: ${response.status} ${text}`);
            }

            const data = await response.json();

            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);

            return this.accessToken as string;

        } catch (error) {
            console.error('Error generating FCM access token:', error);
            throw error;
        }
    }

    /**
     * Sends a push notification via FCM V1 REST API using fetch.
     */
    static async send(
        message: any,
        serviceAccount: FCMServiceAccount
    ): Promise<any> {
        const token = await this.getAccessToken(serviceAccount);

        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            console.error('FCM Send Error REST:', responseData);
            // Standardize error structure if possible or just pass it through
            return {
                success: false,
                error: responseData.error
            };
        }

        return {
            success: true,
            name: responseData.name
        };
    }
}
