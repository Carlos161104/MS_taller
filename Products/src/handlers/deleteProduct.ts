import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { forbidden, internalServerError, notFound, ok } from "../lib/response";
import { errorMessage, logsMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";
import { UserRoleEnum } from "../lib/enums/userEnum";

const table = process.env.PRODUCTS_TABLE || "";

export async function deleteProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.productId;
        const sellerId = event.requestContext.authorizer?.userId;
        const sellerRole = event.requestContext.authorizer?.role;

        if (!productId) {
            return notFound(errorMessage.productNotFound);
        }

        if (sellerRole !== UserRoleEnum.SELLER) {
            return forbidden(errorMessage.forbbiden);
        }

        const result = await dynamoDBDocumentClient.send(new QueryCommand({
            TableName: table,
            KeyConditionExpression: "productId = :productId",
            ExpressionAttributeValues: {
                ":productId": productId
            }
        }));

        const product = result.Items?.[0];
        if (!product) {
            return notFound(errorMessage.productNotFound);
        }

        if (product.sellerId !== sellerId) {
            return forbidden(errorMessage.forbbiden);
        }

        await dynamoDBDocumentClient.send(new DeleteCommand({
            TableName: table,
            Key: {
                productId
            }
        }));

        return ok({
            deleted: true,
            productId,
            message: "Producto eliminado correctamente"
        });
    } catch (error) {
        console.error(logsMessage.ErrorInLambda('deleteProduct'), error);
        return internalServerError(errorMessage.internalServer);
    }
}
