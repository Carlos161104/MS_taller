import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function ping(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log('pong', JSON.stringify(event));
    return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            success: true,
            message: 'pong'
        })
    };
}

export const handler = ping;