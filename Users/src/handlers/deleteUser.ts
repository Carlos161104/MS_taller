import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { forbidden, internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.USERS_TABLE;

export async function deleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;
        const authenticatedUserId = event.requestContext.authorizer?.userId;

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

        if (authenticatedUserId !== user.userId) {
            return forbidden(errorMessage.forbbiden);
        }

        await dynamoDBDocumentClient.send(new DeleteCommand({
            TableName: table,
            Key: {
                userId
            }
        }));

        return ok({
            deleted: true,
            userId,
            message: "Usuario eliminado correctamente"
        });
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('deleteUser'), error);
        return internalServerError(errorMessage.internalServer);
    }
}