import { Stack, StackProps } from "aws-cdk-lib";
import {
  GatewayVpcEndpointAwsService,
  IpAddresses,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { SokratesAnalysisECSTask } from "./sokrates-analysis-ecs-task";
import { SokratesAnalysisStepFunctions } from "./sokrates-analysis-stepfunctions";

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

    const bucket = new Bucket(this, "reports-bucket", {
      bucketName: `${applicationName}-reports`,
    });

    vpc.addGatewayEndpoint("s3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
    });

    const githubTokenSecret = new Secret(this, "github-token-secret", {
      secretName: `${applicationName}-credentials`,
    });

    const { ecsCluster, fargateTaskDefinition } = new SokratesAnalysisECSTask(
      this,
      "sokrates-task",
      {
        vpc,
        bucket,
        githubTokenSecret,
      }
    );

    new SokratesAnalysisStepFunctions(this, "sokrates-step-function", {
      cluster: ecsCluster,
      task: fargateTaskDefinition,
    });
  }
}
