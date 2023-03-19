import { StepFunctions } from "aws-sdk";

const stepfunctions = new StepFunctions({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  console.log({ event });

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN!,
    input: JSON.stringify({ githubOrgName: "projen" }),
  };

  const result = await stepfunctions.startExecution(params).promise();

  const response = {
    statusCode: 200,

    body: JSON.stringify({
      message: "Started step function state machine ",
      stepFunctionExecutionResult: result,
    }),
  };

  return response;
};
