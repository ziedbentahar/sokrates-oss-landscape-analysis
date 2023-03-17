import {
  FargatePlatformVersion,
  ICluster,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import {
  Chain,
  Fail,
  IntegrationPattern,
  JsonPath,
  StateMachine,
  Succeed,
} from "aws-cdk-lib/aws-stepfunctions";
import {
  EcsFargateLaunchTarget,
  EcsRunTask,
} from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";

export interface SokratesAnalysisStepFunctionsProps {
  readonly cluster: ICluster;
  readonly task: TaskDefinition;
}

export class SokratesAnalysisStepFunctions extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: SokratesAnalysisStepFunctionsProps
  ) {
    super(scope, id);

    const runTask = new EcsRunTask(this, `RunTask`, {
      cluster: props.cluster,
      taskDefinition: props.task,
      launchTarget: new EcsFargateLaunchTarget({
        platformVersion: FargatePlatformVersion.LATEST,
      }),
      integrationPattern: IntegrationPattern.RUN_JOB,
      resultPath: "$.RunTask",
      containerOverrides: [
        {
          containerDefinition: props.task.defaultContainer!,

          environment: [
            {
              name: "GITHUB_ORG_NAME",
              value: JsonPath.stringAt("$.githubOrgName"),
            },
          ],
        },
      ],
    });

    const failState = new Fail(this, "fail");
    const successState = new Succeed(this, "success");

    const definition = Chain.start(
      runTask.addCatch(failState).next(successState)
    );

    const stateMachine = new StateMachine(this, `StateMachine`, {
      definition,
    });
  }
}
