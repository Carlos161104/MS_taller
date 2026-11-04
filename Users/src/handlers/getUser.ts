import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.USERS_TABLE;

const sanitizeUser = (user: Record<string, unknown>) => {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export async function getUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;

        if (!userId) {
            return notFound(errorMessage.userNotFound);
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

        return ok(sanitizeUser(user));
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('getUsers'), error);
        return internalServerError(errorMessage.internalServer);
    }
}