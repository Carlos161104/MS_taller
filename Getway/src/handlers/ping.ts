import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function ping(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log('pong ' + event);
    return {
        statusCode: 200,
        headers: { "content-type": "aplication/json" },
        body: JSON.stringify({
            success: true,
            message: `pong ${event}`
        })
    };
}