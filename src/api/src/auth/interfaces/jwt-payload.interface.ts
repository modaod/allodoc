export interface JwtPayload {
    sub: string; // User ID
    email: string; // User email
    organizationId: string; // Organization ID
    roles: string[]; // User roles ['DOCTOR', 'ADMIN']
    permissions: string[]; // User permissions ['patients:read', 'consultations:write']
    sessionId?: string; // Redis session ID for fast validation
    jti?: string; // JWT ID for tracking and blacklisting
    iat?: number; // Issued at
    exp?: number; // Expires at
}
