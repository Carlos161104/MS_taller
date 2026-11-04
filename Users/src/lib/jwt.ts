import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_REFRESH_TOKEN, { expiresIn: '7d' });
}

export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        console.error('Error verifying access token:', error);
        throw new Error('Invalid access token');
    }
}

export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, JWT_REFRESH_TOKEN) as JWTPayload;
    } catch (error) {
        console.error('Error verifying refresh token:', error);
        throw new Error('Invalid refresh token');
    }
}
