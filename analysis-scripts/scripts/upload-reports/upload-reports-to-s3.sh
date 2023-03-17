#!/bin/sh

if [ -v AWS_SECRET_KEY_ID ] && [ -v AWS_SECRET_ACCESS_KEY ] && [ -v AWS_REGION ]
then
    aws configure set default.region $AWS_REGION
    aws configure set aws_access_key_id $AWS_SECRET_KEY_ID
    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    aws s3 sync /sokrates/analysis-artifacts s3://${BUCKET_NAME}/${GITHUB_ORG_NAME}
else
    aws s3 sync /sokrates/analysis-artifacts s3://${BUCKET_NAME}/${GITHUB_ORG_NAME}

fi




  


