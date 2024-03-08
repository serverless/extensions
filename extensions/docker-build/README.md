# EXT: Docker Build Template

This is an EXT Extension Template written in Typescript.
It serves as a demonstration for using Docker within an EXT extension.

[Learn how to use it within the main EXT repo](https://github.com/serverless/ext).

## What it does

In specific cases, you may want to build another Docker image within your extension.
This requires a special permission to be granted to your extension.
When you specify `docker-build` permission in your `extension.yml` 
EXT configures the execution environment differently and makes users aware that your extension can build Docker images.
The Docker daemon socket is mounted in your Extension execution environment,
so you can use Docker API programmatically or by using the Docker CLI.

This is an example `extension.yml` file that grants the `docker-build` permission:

```yaml
# The name of the extension. This is what users will use to reference the extension in their serverless.yml
name: template-docker-build

# The permissions that the extension needs
permissions:
  - docker-build # allows the extension to use Docker in the execution environment

# The configuration that the extension accepts.
# Users can provide these values in the `config` block of the extension instance in their serverless.yml
config:
  name:
    type: string
    description: The name of the Docker image to build
```

This template demonstrates how to use the `docker-build` permission and build a Docker image within your Extension.
