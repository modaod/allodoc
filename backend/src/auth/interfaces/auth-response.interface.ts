export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: string[];
        organizationId: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds until access token expires
}