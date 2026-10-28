import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function registerHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            success: true,
            message: 'Hola desde el handler de registro'
        })
    };
}