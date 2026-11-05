import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { internalServerError, ok } from "../lib/response";
import { errorMessage } from "../lib/constants/message";
import { dynamoDBDocumentClient } from "../lib/dynamoDB";

const products = process.env.PRODUCTS_TABLE;

export async function listProducts(event : APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const result = await dynamoDBDocumentClient.send({
            TableName: products,
            Limit: 100
        });


        return ok(result.Items);
    }catch (error) {
        console.error("Error in listProducts lambda", error);
        return internalServerError(errorMessage.internalServer);
    }   
} 