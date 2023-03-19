import { Stack, StackProps } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { SokratesAnalysisECSTask } from "./sokrates-analysis-ecs-task";
import { SokratesAnalysisBucket } from "./sokrates-analysis-result-bucket";
import { SokratesAnalysisSchedule } from "./sokrates-analysis-schedule";
import { SokratesAnalysisStepFunctions } from "./sokrates-analysis-stepfunctions";
import { SokratesReportsDistribution } from "./sokrates-reports-distribution";
import { SokratesVPC } from "./sokrates-vpc";

export class Sokrates extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const applicationName = "sokrates";

    const { vpc } = new SokratesVPC(this, "sokrates-vpc", {
      applicationName,
    });

    const githubTokenSecret = new Secret(this, "github-token-secret", {
      secretName: `${applicationName}-credentials`,
    });

    const analysisReportsBucket = new SokratesAnalysisBucket(
      this,
      "analysis-reports-bucket",
      {
        applicationName: `${applicationName}`,
      }
    );

    const { ecsCluster, fargateTaskDefinition } = new SokratesAnalysisECSTask(
      this,
      "sokrates-task",
      {
        vpc,
        bucket: analysisReportsBucket.bucket,
        githubTokenSecret,
        applicationName,
      }
    );

    const { stateMachine } = new SokratesAnalysisStepFunctions(
      this,
      "sokrates-step-function",
      {
        cluster: ecsCluster,
        task: fargateTaskDefinition,
        applicationName,
      }
    );

    new SokratesAnalysisSchedule(this, "sokrates-analysis-schedule", {
      targetStateMachine: stateMachine,
      applicationName,
    });

    new SokratesReportsDistribution(this, "sokrates-distribution", {
      applicationName,
      bucket: analysisReportsBucket.bucket,
    });
  }
}
