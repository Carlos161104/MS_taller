import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { badRequest, internalServerError, ok } from "../lib/response";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import bycript from "bcryptjs";
import { v4 as uuidV4 } from "uuid";
import { UserInterface } from "../lib/types/user";

const table = process.env.USERS_TABLE;

export async function register(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event.body || '{}');
        const { email, password, name, role } = body;

        if (!email || !password || !name || !role) {
            return badRequest('Faltan campos requeridos: email, password, name y role son obligatorios');
        }

        const existingUser = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        }));

        const passwordHashed = await bycript.hash(password, 10);
        const now = new Date().toISOString();

        if (existingUser.Items && existingUser.Items.length > 0) {
            return badRequest('El email ya está registrado');
        }

        const user: UserInterface = {
            userId: uuidV4(),
            email: email,
            password: passwordHashed,
            name,
            role,
            createdAt: now,
            uploadedAt: now
        }
        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: table,
            Item: user
        }));

        const {
            password: _, ...userPublic
        } = user;
        return ok(userPublic);
    } catch (error) {

        return internalServerError('Error al registrar usuario' + (error instanceof Error ? `: ${error.message}` : ''));
    }

}