export interface GoogleAdsAppCredentials {
    clientId: string;
    clientSecret: string;
    developerToken: string;
    loginCustomerId: string;
}

export interface GoogleAdsCredentials {
    customerId: string;
    refreshToken: string;
    app: GoogleAdsAppCredentials;
}
