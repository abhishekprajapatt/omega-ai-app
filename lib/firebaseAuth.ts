import jwt from 'jsonwebtoken';

/**
 * Verify Firebase ID token from Authorization header
 * Extracts the user ID from the token's 'sub' claim
 * @param token - Firebase ID token (without 'Bearer ' prefix)
 * @returns The Firebase UID (user ID) or null if verification fails
 */
export async function verifyFirebaseToken(
  token: string,
): Promise<string | null> {
  try {
    if (!token || token.trim() === '') {
      console.error('[Token] Token is empty or whitespace');
      return null;
    }

    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      console.error('[Token] Failed to decode token');
      return null;
    }

    console.log('[Token] Decoded token claims:', {
      sub: decoded?.sub,
      uid: decoded?.uid,
      iss: decoded?.iss,
      aud: decoded?.aud,
    });

    const uid = decoded?.sub || decoded?.uid;

    if (!uid) {
      console.error('[Token] Token missing sub or uid claim');
      return null;
    }

    console.log('[Token] Verified successfully, UID:', uid);
    return uid;
  } catch (error) {
    console.error('[Token] Verification failed:', error);
    return null;
  }
}

/**
 * Extract Firebase ID token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns The token without 'Bearer ' prefix, or null if not present
 */
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) {
    console.error('[Auth] No auth header provided');
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    console.error(
      '[Auth] Invalid auth header format:',
      authHeader.substring(0, 30),
    );
    return null;
  }
  console.log('[Auth] Token extracted successfully');
  return match ? match[1] : null;
}

/**
 * Get user ID from request Authorization header
 * @param req - NextRequest object
 * @returns The Firebase UID or null if not authenticated
 */
export async function getUserIdFromRequest(req: {
  headers: { get: (key: string) => string | null };
}): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

  const token = extractTokenFromHeader(authHeader);
  console.log('Token extracted:', token ? 'Yes' : 'No');

  if (!token) {
    console.error('No token in Authorization header');
    return null;
  }

  const userId = await verifyFirebaseToken(token);
  console.log('User ID from token:', userId || 'Failed to extract');

  return userId;
}
