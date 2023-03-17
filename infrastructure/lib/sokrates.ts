import { IgnoreMode, Stack, StackProps } from "aws-cdk-lib";
import {
  GatewayVpcEndpointAwsService,
  IpAddresses,
  IVpc,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  Secret as ecs_Secret,
} from "aws-cdk-lib/aws-ecs";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

const resolve = require("path").resolve;

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

    new SokratesTask(this, "sokrates-task", {
      vpc,
      bucket,
      githubTokenSecret,
    });
  }
}

interface SokratesTaskProps {
  readonly vpc: IVpc;
  readonly bucket: IBucket;
  readonly githubTokenSecret: ISecret;
}

export class SokratesTask extends Construct {
  readonly fargateTaskDefinition: FargateTaskDefinition;
  readonly ecsCluster: Cluster;

  constructor(scope: Construct, id: string, props: SokratesTaskProps) {
    super(scope, id);

    const cluster = new Cluster(this, `Cluster`, {
      vpc: props.vpc,
    });

    const td = new FargateTaskDefinition(this, `TaskDefinition`, {
      memoryLimitMiB: 4096,
      cpu: 2048,
    });

    td.addContainer(`Container`, {
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
      secrets: {
        GITHUB_API_TOKEN: ecs_Secret.fromSecretsManager(
          props.githubTokenSecret
        ),
      },
      image: ContainerImage.fromAsset("../", {
        ignoreMode: IgnoreMode.DOCKER,
      }),

      logging: new AwsLogDriver({
        streamPrefix: "sokrates",
      }),
    });

    this.ecsCluster = cluster;
    this.fargateTaskDefinition = td;

    props.bucket.grantReadWrite(this.fargateTaskDefinition.taskRole);
  }
}
