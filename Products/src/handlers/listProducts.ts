import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { internalServerError, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const products = process.env.PRODUCTS_TABLE || "";

export async function listProducts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        let allProducts: any[] = [];
        let lastEvaluatedKey: Record<string, any> | undefined;

        do {
            const result = await dynamoDBDocumentClient.send(new ScanCommand({
                TableName: products,
                ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
                Limit: 100
            }));

            allProducts = [...allProducts, ...(result.Items ?? [])];
            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        return ok(allProducts);
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('listProducts'), error);
        return internalServerError(errorMessage.internalServer);
    }
}