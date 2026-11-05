import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.PRODUCTS_TABLE;

export async function listProducts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.productId;
        if (!productId) return notFound(errorMessage.productNotFound);

        const existing = await dynamoDBDocumentClient.send(new GetCommand({
            TableName: table,
            Key: {
                productId: productId
            }
        }));

        if (!existing.Item) return notFound(errorMessage.productNotFound);

        const body = JSON.parse(event.body || "{}");
        const { quantity } = body;

        if (!quantity || typeof quantity !== "number" || quantity < 0) {
            return notFound(errorMessage.invalidQuantity);
        }

        if (existing.Item.stock < quantity) {
            return notFound(errorMessage.invalidQuantity);
        }

        await dynamoDBDocumentClient.send(new UpdateCommand({
            TableName: table,
            Key: {
                productId: productId
            },
            UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
            ConditionExpression: "stock >= :quantity",
            ExpressionAttributeValues: {
                ":quantity": quantity,
                ":updatedAt": new Date().toISOString()
            }
        }));

        return ok({ message: "Stock actualizado exitosamente" });
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('updateProduct'), error);
        return internalServerError(errorMessage.internalServer);
    }

}