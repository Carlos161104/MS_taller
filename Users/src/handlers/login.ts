import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { loginDto } from "../lib/dtos/login.dto";
import { badRequest, internalServerError, ok, unauthorized } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bycript from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";

const table = process.env.USERS_TABLE;
const refreshTokensTable = process.env.REFRESH_TOKENS_TABLE;

export async function login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body: loginDto = JSON.parse(event.body || '{ }');
        if (!body.password || !body.email) {
            return badRequest(errorMessage.badPayload);
        }

        const result = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": body.email
            }
        }));

        if (!result.Items || result.Items.length === 0) {
            return unauthorized(errorMessage.badCredentials);
        }

        const user = result.Items[0];
        const validPwd = await bycript.compare(body.password, user.password);

        if (!validPwd) {
            return unauthorized(errorMessage.badCredentials);
        }

        const paylod = {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role
        }

        const accessToken = generateAccessToken(paylod);
        const refreshToken = generateRefreshToken(paylod);

        const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days in seconds

        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: refreshTokensTable,
            Item: {
                token: refreshToken,
                userId: paylod.userId,
                expiresAt
            }
        }));

        return ok({
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.log(logsMessage.ErrorInLambda('login'), error);
        return internalServerError(errorMessage.internalServer);
    }

} 