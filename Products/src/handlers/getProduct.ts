import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.PRODUCTS_TABLE;

export async function getProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.productId;
        if (!productId) {
            return notFound(errorMessage.productNotFound);
        }

        const params = {
            TableName: table,
            KeyConditionExpression: "productId = :productId",
            ExpressionAttributeValues: {
                ":productId": productId,
            },
        };

        const command = new QueryCommand(params);
        const result = await dynamoDBDocumentClient.send(command);
        if (!result.Items || result.Items.length === 0) {
            return notFound(errorMessage.productNotFound);
        }

        return ok(result.Items);
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('getProduct'), error);
        return internalServerError(errorMessage.internalServer);
    }
}