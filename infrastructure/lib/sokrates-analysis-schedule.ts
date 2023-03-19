import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import {
  addLambdaPermission,
  LambdaFunction,
} from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";

const resolve = require("path").resolve;
import fs = require("fs");

export interface SokratesAnalysisScheduleProps {
  readonly targetStateMachine: StateMachine;
  readonly applicationName: string;
}

export class SokratesAnalysisSchedule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: SokratesAnalysisScheduleProps
  ) {
    super(scope, id);

    const triggerAnalysesJobForOrganisation = new NodejsFunction(
      this,
      `trigger-analyses-job`,
      {
        memorySize: 128,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        logRetention: RetentionDays.THREE_DAYS,
        handler: "handler",
        entry: resolve(
          "../analysis-scheduling/lambdas/trigger-job-for-organisation-lambda.ts"
        ),
        functionName: `${props.applicationName}-trigger-analysis-job`,
        environment: {
          STATE_MACHINE_ARN: props.targetStateMachine.stateMachineArn,
        },
      }
    );

    triggerAnalysesJobForOrganisation.addToRolePolicy(
      new PolicyStatement({
        actions: ["states:StartExecution"],
        effect: Effect.ALLOW,
        resources: [props.targetStateMachine.stateMachineArn],
      })
    );

    const scheduleConfig = JSON.parse(
      fs.readFileSync("../analysis-scheduling/schedules.json", "utf8")
    ) as {
      githubOrganisation: string;
      cron: string;
    }[];

    scheduleConfig.map((c) => {
      const rule = new Rule(
        this,
        `${props.applicationName}-rule-${c.githubOrganisation}`,
        {
          schedule: Schedule.expression(`cron(${c.cron})`),
          targets: [
            new LambdaFunction(triggerAnalysesJobForOrganisation, {
              event: RuleTargetInput.fromObject({
                message: c.githubOrganisation,
              }),
            }),
          ],
        }
      );

      addLambdaPermission(rule, triggerAnalysesJobForOrganisation);

      return rule;
    });
  }
}
