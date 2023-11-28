# CDK Extension

This extension will allow you to deploy a CDK application using EXT. Right now this extension only supports deploying Javascript and Typescript based CDK applications.

## Configuration Options

| Option | Required | Default | Description |
| ------ | -------- | ------- | ----------- |
| path | no | ./ | The Path to the CDK application, relative to your `ext.yaml` file |
| region | no | us-east-1 | The AWS region to run the CDK application against |

## Custom Actions

| Action | Description |
| ------- | ----------- |
| bootstrap | Run CDK bootstrap |

## Ext.yaml Example

```yaml
service: my-cdk-app

cdk-instance:
  extension: cdk@latest
  config:
    region: us-east-2
```

## Building Extension

Building a local copy of the CDK Runner extension, is extremely simple. Just clone this repo and run,

```
ext developer build
```

## Running the Example

If you want to test this extension you can use the example provided in this repo.

1. `cd example`
2. `npm i`
3. If this is your first time using CDK in a given account you will want to run the bootstrap Action `ext cdk-instance bootstrap` otherwise skip that step.
4. `ext run` This will deploy a CDK example stack with single SQS queue and an output of the queue URL
5. Run `ext info` and you can confirm that your queue URL is stored in the EXT state store
6. Finally if you run `ext remove` you will see your CDK application removed