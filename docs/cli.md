# CLI docs

### macOS

`squiss-jobs` ships with an executable script of the same name to help you create a personal dev job queue in SQS.  The queue name will be `${project-dirname}-jobs-${aws-username}`, and will have a `RedrivePolicy` pushing to a [deadletter queue](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/SQSDeadLetterQueue.html) after 3 job failures.

To run the script, you can either install globally with `npm i -g squiss-jobs`, or install normally and include it in your `npm` scripts in the `package.json`.  After creating your queues, it will output the job queue URL for you to include in your ENV.

```sh
scotts-air:squiss-jobs scott$ squiss-jobs

Copy the following into your .env file:
JOBS_URI=https://queue.amazonaws.com/689543204258/squiss-jobs-jobs-smccormack
```

**Note:** The executable script requires `brew`.  It will `brew install` both `jq` and `awscli` if not present, and then allow you to configure your AWS creds before continuing.

### Windows

On Windows, you can use `Create-JobsQueue.ps1` to create your personal dev job queue in SQS. If you don't provide a value for the `QueueName` parameter to the script, the queue name will be `${current-directory-name}-jobs-${aws-username}`, and will have a `RedrivePolicy` pushing to a [deadletter queue](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/SQSDeadLetterQueue.html) after 3 job failures.

```PowerShell
~ > .\Create-JobsQueue.ps1 squiss-jobs
Copy the following into your .env file:
JOBS_URI=https://queue.amazonaws.com/689543204258/squiss-jobs-jobs-jwelle
```

**Note:** The PowerShell script requires the [AWS CLI](https://aws.amazon.com/cli/) to be installed and configured. It will fail otherwise.
