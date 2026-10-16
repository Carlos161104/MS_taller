import type { APIGatewayTokenAuthorizerHandler, APIGatewayAuthorizerResult } from "aws-lambda";
import { verifyAccessToken } from "./lib/JWT";

// Function to generate IAM policy for the user
const generatePolicy = (
    principalId: string,
    effect: "Allow" | "Deny",
    resource: string,
    context?: Record<string, string>
): APIGatewayAuthorizerResult => ({
    principalId,
    policyDocument: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "execute-api:Invoke",
                Effect: effect,
                Resource: resource,
            },
        ],
    },
    context
});

// Lambda function to handle the authorization
export const authorizer: APIGatewayTokenAuthorizerHandler = async (event) => {
    const token = event.authorizationToken?.replace("Bearer ", "");
    if (!token) {
        throw new Error("Unauthorized");
    }

    try {
        const payload = verifyAccessToken(token);
        return generatePolicy(payload.userId, "Allow", event.methodArn, { role: payload.role });
    } catch (error) {
        throw new Error("Unauthorized");
    }
}