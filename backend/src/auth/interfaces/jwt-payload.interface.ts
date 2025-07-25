export interface JwtPayload {
    sub: string;          // User ID
    email: string;        // User email
    organizationId: string; // Organization ID
    roles: string[];      // User roles ['DOCTOR', 'ADMIN']
    permissions: string[]; // User permissions ['patients:read', 'consultations:write']
    iat?: number;         // Issued at
    exp?: number;         // Expires at
}