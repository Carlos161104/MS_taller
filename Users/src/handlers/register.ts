import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { badRequest, internalServerError, ok } from "../lib/response";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import bycript from "bcryptjs";
import { v4 as uuidV4 } from "uuid";
import { UserInterface } from "../lib/types/user";
import { errorMessage, logsMessage } from "../lib/constants/message";

const table = process.env.USERS_TABLE;

export async function register(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event.body || '{}');
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const role = typeof body.role === "string" ? body.role : "";

        if (!email || !password || !name || !role) {
            return badRequest(errorMessage.badPayload);
        }

        const existingUser = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        }));

        if (existingUser.Items && existingUser.Items.length > 0) {
            return badRequest(errorMessage.userAlreadyExist);
        }

        const passwordHashed = await bycript.hash(password, 10);
        const now = new Date().toISOString();

        const user: UserInterface = {
            userId: uuidV4(),
            email,
            password: passwordHashed,
            name,
            role,
            createdAt: now,
            uploadedAt: now
        };

        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: table,
            Item: user
        }));

        const { password: _, ...userPublic } = user;
        return ok(userPublic);
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('register'), error);
        return internalServerError(errorMessage.internalServer);
    }
}