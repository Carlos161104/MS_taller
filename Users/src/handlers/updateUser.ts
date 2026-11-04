import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bycript from "bcryptjs";
import { badRequest, forbidden, internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.USERS_TABLE;

export async function updateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;
        const authenticatedUserId = event.requestContext.authorizer?.userId;

        if (!userId) {
            return notFound(errorMessage.userNotFound);
        }

        const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body ?? {});

        if (!body || Object.keys(body).length === 0) {
            return badRequest(errorMessage.badPayload);
        }

        const result = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        }));

        const user = result.Items?.[0];
        if (!user) {
            return notFound(errorMessage.userNotFound);
        }

        if (authenticatedUserId !== user.userId) {
            return forbidden(errorMessage.forbbiden);
        }

        const updates: Record<string, unknown> = {
            ...user
        };

        if (typeof body.name === "string" && body.name.trim()) {
            updates.name = body.name.trim();
        }

        if (typeof body.email === "string" && body.email.trim()) {
            const normalizedEmail = body.email.trim().toLowerCase();

            if (normalizedEmail !== user.email) {
                const emailResult = await dynamoDBDocumentClient.send(new QueryCommand({
                    TableName: table,
                    IndexName: "email-index",
                    KeyConditionExpression: "email = :email",
                    ExpressionAttributeValues: {
                        ":email": normalizedEmail
                    }
                }));

                if (emailResult.Items && emailResult.Items.length > 0) {
                    return badRequest(errorMessage.userAlreadyExist);
                }
            }

            updates.email = normalizedEmail;
        }

        if (typeof body.password === "string" && body.password.trim()) {
            updates.password = await bycript.hash(body.password, 10);
        }

        const hasChanges = Object.keys(updates).some((key) => updates[key] !== user[key]);
        if (!hasChanges) {
            return badRequest(errorMessage.badPayload);
        }

        const updatedAt = new Date().toISOString();
        const updatedUser = {
            ...user,
            ...updates,
            updatedAt
        } as typeof user & { updatedAt: string };

        const { password: passwordValue, ...userPublic } = updatedUser as typeof updatedUser & { password?: string };
        void passwordValue;

        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: table,
            Item: updatedUser
        }));

        return ok(userPublic);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return badRequest(errorMessage.badPayload);
        }

        console.error(logsMessage.ErrorInLambda('updateUser'), error);
        return internalServerError(errorMessage.internalServer);
    }
}