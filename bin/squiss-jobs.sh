#!/bin/sh

[ $(brew list | grep jq | wc -l) -eq 0 ] && brew install jq

if [ $(brew list | grep awscli | wc -l) -eq 0 ]; then
  brew update
  brew install awscli
  aws configure
fi

username=$(aws iam get-user | jq -r '.User.UserName')

deadName="${PWD##*/}-jobs-${username}-dead"
jobsName="${PWD##*/}-jobs-${username}"

deadUri=$(aws sqs create-queue --queue-name ${deadName} | jq -r '.QueueUrl')
deadArn=$(aws sqs get-queue-attributes --queue-url ${deadUri} --attribute-names QueueArn | jq -r '.Attributes.QueueArn')

jobsUri=$(aws sqs create-queue --queue-name ${jobsName} --attributes "{\"MessageRetentionPeriod\":\"259200\",\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${deadArn}\\\",\\\"maxReceiveCount\\\":\\\"10\\\"}\"}" | jq -r '.QueueUrl')

echo "\nCopy the following into your .env file:"
echo "JOBS_URI=${jobsUri}\n"
