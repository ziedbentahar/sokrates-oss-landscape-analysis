import { Stack, StackProps } from "aws-cdk-lib";
import {
  GatewayVpcEndpointAwsService,
  IpAddresses,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { SokratesAnalysisECSTask } from "./sokrates-analysis-ecs-task";
import { SokratesAnalysisBucket } from "./sokrates-analysis-result-bucket";
import { SokratesAnalysisStepFunctions } from "./sokrates-analysis-stepfunctions";
import { SokratesReportsDistributionBucket } from "./sokrates-reports-distribution";

export class Sokrates extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const applicationName = "sokrates";

    const vpc = new Vpc(this, "sokrates-vpc", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/24"),
      subnetConfiguration: [
        { name: "public-subnet", subnetType: SubnetType.PUBLIC },
        {
          name: "privat-subnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    vpc.addGatewayEndpoint("s3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: SubnetType.PRIVATE_WITH_EGRESS }],
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
      }
    );

    new SokratesAnalysisStepFunctions(this, "sokrates-step-function", {
      cluster: ecsCluster,
      task: fargateTaskDefinition,
    });

    new SokratesReportsDistributionBucket(this, "sokrates-distribution", {
      applicationName,
      bucket: analysisReportsBucket.bucket,
    });
  }
}
