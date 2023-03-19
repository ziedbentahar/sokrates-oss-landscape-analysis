import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CanonicalUserPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface SokratesReportsDistributionProps {
  readonly applicationName: string;
  readonly bucket: IBucket;
}

export class SokratesReportsDistribution extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: SokratesReportsDistributionProps
  ) {
    super(scope, id);

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "origin-access-identity"
    );

    props.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [props.bucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const origin = new S3Origin(props.bucket, {
      originAccessIdentity,
    });

    const cloudfrontDistribution = new Distribution(
      this,
      "cloud-front-distribution",
      {
        defaultBehavior: {
          origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );
  }
}
