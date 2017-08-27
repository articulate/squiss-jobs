#!/bin/sh

[ $(brew list | grep jq | wc -l) -eq 0 ] && brew install jq

if [ $(brew list | grep awscli | wc -l) -eq 0 ]; then
  brew update
  brew install awscli
  aws configure
fi

username=$(aws iam get-user | jq -r '.User.UserName')

defaultQueueName=${PWD##*/}
queueName=${1-$defaultQueueName}
deadName="${queueName}-jobs-${username}-dead"
jobsName="${queueName}-jobs-${username}"

deadUri=$(aws sqs create-queue --queue-name ${deadName} | jq -r '.QueueUrl')
deadArn=$(aws sqs get-queue-attributes --queue-url ${deadUri} --attribute-names QueueArn | jq -r '.Attributes.QueueArn')

jobsUri=$(aws sqs create-queue --queue-name ${jobsName} --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${deadArn}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}" | jq -r '.QueueUrl')

echo "\nQueue available at: ${jobsUri}\n"
