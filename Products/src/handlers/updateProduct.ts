import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { badRequest, forbidden, internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import { UserRoleEnum } from "../lib/enums/userEnum";
import { Product } from "../lib/types/product";

const table = process.env.PRODUCTS_TABLE || "";

export async function updateProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.productId;
        const sellerId = event.requestContext.authorizer?.userId;
        const sellerRole = event.requestContext.authorizer?.role;

        if (!productId) return notFound(errorMessage.productNotFound);
        if (sellerRole !== UserRoleEnum.SELLER) return forbidden(errorMessage.forbbiden);

        const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body ?? {});
        const updates = validateDto(body);

        if ("statusCode" in updates) return updates;

        const result = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            KeyConditionExpression: "productId = :productId",
            ExpressionAttributeValues: {
                ":productId": productId,
            }
        }));

        const product = result.Items?.[0] as Product | undefined;
        if (!product) return notFound(errorMessage.productNotFound);
        if (product.sellerId !== sellerId) return forbidden(errorMessage.forbbiden);

        const updateExpressionParts: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        Object.entries(updates).forEach(([key, value]) => {
            const attributeName = `#${key}`;
            const attributeValue = `:${key}`;
            expressionAttributeNames[attributeName] = key;
            expressionAttributeValues[attributeValue] = value;
            updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
        });

        const updatedAt = new Date().toISOString();
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeValues[":updatedAt"] = updatedAt;
        updateExpressionParts.push("#updatedAt = :updatedAt");

        await dynamoDBDocumentClient.send(new UpdateCommand({
            TableName: table,
            Key: { productId },
            UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }));

        return ok({
            ...product,
            ...updates,
            updatedAt
        });
    } catch (error) {
        if (error instanceof SyntaxError) {
            return badRequest(errorMessage.badPayload);
        }

        console.error(logsMessage.ErrorInLambda('updateProduct'), error);
        return internalServerError(errorMessage.internalServer);
    }
}

const validateDto = (body: unknown): Partial<Product> | APIGatewayProxyResult => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return badRequest(errorMessage.badPayload);
    }

    const payload = body as Record<string, unknown>;
    const allowedFields = ["name", "description", "price", "stock"] as const;
    const updates: Partial<Product> = {};

    for (const key of allowedFields) {
        if (!(key in payload)) continue;

        const value = payload[key];

        if (key === "name" || key === "description") {
            if (typeof value !== "string" || !value.trim()) return badRequest(errorMessage.badPayload);
            updates[key] = value.trim() as never;
            continue;
        }

        if (key === "price") {
            if (typeof value !== "number" || Number.isNaN(value) || value < 0) return badRequest(errorMessage.badPayload);
            updates[key] = value;
            continue;
        }

        if (key === "stock") {
            if (typeof value !== "number" || Number.isNaN(value) || value < 0 || !Number.isInteger(value)) return badRequest(errorMessage.badPayload);
            updates[key] = value;
        }
    }

    return Object.keys(updates).length > 0 ? updates : badRequest(errorMessage.badPayload);
};
