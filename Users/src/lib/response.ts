import { APIGatewayProxyResult } from "aws-lambda";

export const ok = (data: unknown): APIGatewayProxyResult => ({
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
        success: true,
        data
    })
})

export const badRequest = (message: string): APIGatewayProxyResult => ({
    statusCode: 400,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
        success: false,
        message
    })
})