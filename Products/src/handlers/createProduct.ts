import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { badRequest, create, forbidden, internalServerError } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import { UserRoleEnum } from "../lib/enums/userEnum";
import { Product } from "../lib/types/product";
import { v4 as uuidv4 } from "uuid";

const table = process.env.PRODUCTS_TABLE || "";

const isApiGatewayError = (value: unknown): value is APIGatewayProxyResult => {
    return typeof value === "object" && value !== null && "statusCode" in value && "body" in value;
};

export async function createProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const sellerId = event.requestContext.authorizer?.userId;
        const sellerRole = event.requestContext.authorizer?.role;

        if (sellerRole !== UserRoleEnum.SELLER) {
            return forbidden(errorMessage.forbbiden);
        }

        const parsedBody = typeof event.body === "string" ? JSON.parse(event.body || "{}") : {};
        const validatedBody = validateDto(parsedBody);

        if (isApiGatewayError(validatedBody)) {
            return validatedBody;
        }

        const { name, description, price, stock } = validatedBody;
        const now = new Date().toISOString();

        const product: Product = {
            productId: uuidv4(),
            sellerId: sellerId || "",
            name,
            description,
            price,
            stock,
            createdAt: now,
            updatedAt: now
        };

        await dynamoDBDocumentClient.send(new PutCommand({
            TableName: table,
            Item: product
        }));

        return create(product);
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('createProduct'), error);
        return internalServerError(errorMessage.internalServer);
    }
}

const validateDto = (body: any): { name: string; description: string; price: number; stock: number } | APIGatewayProxyResult => {
    if (!body || typeof body !== "object") {
        return badRequest(errorMessage.badPayload);
    }

    const { name, description, price, stock } = body;

    if (
        typeof name !== "string" || !name.trim() ||
        typeof description !== "string" || !description.trim() ||
        typeof price !== "number" || Number.isNaN(price) || price < 0 ||
        typeof stock !== "number" || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)
    ) {
        return badRequest(errorMessage.badPayload);
    }

    return {
        name: name.trim(),
        description: description.trim(),
        price,
        stock
    };
};