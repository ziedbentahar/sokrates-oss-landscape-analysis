import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface SokratesAnalysisBucketProps {
  readonly applicationName: string;
}

export class SokratesAnalysisBucket extends Construct {
  readonly bucket: IBucket;

  constructor(
    scope: Construct,
    id: string,
    props: SokratesAnalysisBucketProps
  ) {
    super(scope, id);

    this.bucket = new Bucket(this, "reports-bucket", {
      bucketName: `${props.applicationName}-reports`,
    });
  }
}
