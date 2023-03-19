import { IgnoreMode } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  Secret as ecs_Secret,
} from "aws-cdk-lib/aws-ecs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface SokratesAnalysisECSTaskProps {
  readonly vpc: IVpc;
  readonly bucket: IBucket;
  readonly githubTokenSecret: ISecret;
  readonly applicationName: string;
}

export class SokratesAnalysisECSTask extends Construct {
  readonly fargateTaskDefinition: FargateTaskDefinition;
  readonly ecsCluster: Cluster;

  constructor(
    scope: Construct,
    id: string,
    props: SokratesAnalysisECSTaskProps
  ) {
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
