import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || 'local_secret_key';

export interface JwtPayload {
    userId: string;
    role: string;
}

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, secretKey) as JwtPayload;
}
