# S3 State Sync

This extension can be used by the `EXT` CLI's `stateSync` property to sync your `EXT` state between your local machine and S3.

## Configuration Options

| Option | Required | Default | Description |
| ------ | -------- | ------- | ----------- |
| bucket | yes | | The S3 Bucket to store state in |
| prefix | no | / | The base prefix to use in the bucket |

By default state is stored in the following prefix under your bucket, `<OPTIONAL_CONFIGURED_PREFIX>/<SERVICE_NAME>/<STAGE/state.json`

## Ext.yaml Example

```yaml
service: my-test-service

stateSync:
  extension: state-aws-s3@latest
  config:
    s3Bucket: ext-remote-state-sync-testing
```

## Building

From the `./state/aws-s3` directory run,

```
ext developer build
```