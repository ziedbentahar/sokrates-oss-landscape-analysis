import { StepFunctions } from "aws-sdk";

const stepfunctions = new StepFunctions({ region: process.env.AWS_REGION });

export const handler = async (event: { githubOrganisation: string }) => {
  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN!,
    input: JSON.stringify(event),
  };

  const result = await stepfunctions.startExecution(params).promise();

  const response = {
    statusCode: 200,

    body: JSON.stringify({
      message: `Started step function state machine for ${event.githubOrganisation}`,
      stepFunctionExecutionResult: result,
    }),
  };

  return response;
};
