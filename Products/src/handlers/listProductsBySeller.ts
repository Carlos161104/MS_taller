import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const table = process.env.PRODUCTS_TABLE;

export async function listProductsBySeller(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const sellerId = event.pathParameters?.sellerId;

        if (!sellerId) {
            return notFound(errorMessage.productNotFound);
        }

        let allProducts: any[] = [];
        let lastEvaluatedKey: Record<string, any> | undefined;

        do {
            const result = await dynamoDBDocumentClient.send(new QueryCommand({
                TableName: table,
                IndexName: "seller-index",
                KeyConditionExpression: "sellerId = :sellerId",
                ExpressionAttributeValues: {
                    ":sellerId": sellerId,
                },
                ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
                Limit: 100,
            }));

            allProducts = [...allProducts, ...(result.Items ?? [])];
            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        return ok(allProducts);
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('listProductsBySeller'), error);
        return internalServerError(errorMessage.internalServer);
    }
}