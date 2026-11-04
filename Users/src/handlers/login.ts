import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { loginDto } from "../lib/dtos/login.dto";
import { badRequest, internalServerError, ok, unauthorized } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bycript from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";

const table = process.env.USERS_TABLE;
const refreshTokensTable = process.env.REFRESH_TOKENS_TABLE;

export async function login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event.body || "{}") as Partial<loginDto>;
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !password) {
            return badRequest(errorMessage.badPayload);
        }

        const result = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        }));

        const user = result.Items?.[0];
        if (!user || !user.password) {
            return unauthorized(errorMessage.badCredentials);
        }

        const passwordIsValid = await bycript.compare(password, user.password);
        if (!passwordIsValid) {
            return unauthorized(errorMessage.badCredentials);
        }

        const payload = {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: refreshTokensTable,
            Item: {
                token: refreshToken,
                userId: payload.userId,
                expiresAt
            }
        }));

        return ok({
            accessToken,
            refreshToken
        });

    } catch (error) {
        if (error instanceof SyntaxError) {
            return badRequest(errorMessage.badPayload);
        }

        console.log(logsMessage.ErrorInLambda('login'), error);
        return internalServerError(errorMessage.internalServer);
    }
}