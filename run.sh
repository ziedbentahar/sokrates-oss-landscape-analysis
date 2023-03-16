#! /bin/bash


checkForVariable() {


    if [[ -z ${!1+set} ]]; then
       echo "$1 environment variable is not defined, $1 is mandatory and must be defined"
       exit 1
    fi
}

checkForVariable GITHUB_API_TOKEN
checkForVariable GITHUB_ORG_NAME
checkForVariable BUCKET_NAME


envsubst < /sokrates/analysis-scripts/config.tpl.json > ./analysis-scripts/config.json

bash run-generate-scripts.sh
bash run-execute-scripts.sh

bash /sokrates/analysis-scripts/scripts/upload-reports/upload-reports-to-s3.sh