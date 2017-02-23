Param(
  [Parameter(Position=0)]
  [string]$QueueName = (Split-Path $PSScriptRoot -Leaf)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"
$Error.Clear()

$userName = (aws iam get-user | ConvertFrom-Json).User.UserName
$deadName = "$QueueName-jobs-$userName-dead"
$jobsName = "$QueueName-jobs-$userName"
$deadUri  = (aws sqs create-queue --queue-name $deadName | ConvertFrom-Json).QueueUrl
$deadArn  = (aws sqs get-queue-attributes --queue-url $deadUri --attribute-names QueueArn | ConvertFrom-Json).Attributes.QueueArn

$json = @"
{
  \"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"$deadArn\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"
}
"@

$jobsUri  = (aws sqs create-queue --queue-name ${jobsName} --attributes $json | ConvertFrom-Json).QueueUrl

Write-Host "Copy the following into your .env file:"
Write-Host "JOBS_URI=$jobsUri"