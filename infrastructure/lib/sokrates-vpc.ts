import {
  GatewayVpcEndpointAwsService,
  IpAddresses,
  IVpc,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";

export interface SokratesVPCProps {
  readonly applicationName: string;
}

export class SokratesVPC extends Construct {
  readonly vpc: IVpc;
  readonly ecsCluster: Cluster;

  constructor(scope: Construct, id: string, props: SokratesVPCProps) {
    super(scope, id);

    this.vpc = new Vpc(this, "sokrates-vpc", {
      vpcName: `${props.applicationName}-vpc`,
      ipAddresses: IpAddresses.cidr("10.0.0.0/24"),
      subnetConfiguration: [
        { name: "public-subnet", subnetType: SubnetType.PUBLIC },
        {
          name: "privat-subnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.vpc.addGatewayEndpoint("s3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: SubnetType.PRIVATE_WITH_EGRESS }],
    });
  }
}
