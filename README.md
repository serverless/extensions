# EXT

**Run, Build & Share Developer Experiences.**

# Quick-Start





The Extension can be run immediately, or after you make changes. However, the Extension container must always be built with the latest changes, or if it is being run for the first time. Within the root of the Extension, build the container (this will soon be within the main CLI):

```
npm run build
```

To run your Extension, cd into the `./example` folder within your Extension. You'll see there is a `serverless.yml` file in there which contains an Extension within `inputs`. You can use this file to test with. When you run the following command, that file and those inputs will be fed into your Extension.

```
ext
```

Remember, whenever you make changes, you will have to build the container again.

Check out the **[Building Extensions](#building-extensions)** section for more information on how to build your Extension.

# Building Extensions

Here is the thorough guide on building Extensions.

## Extension Manifest

Every extension when published requires a `manifest.yaml` file that defines documentation about the extension. It must include types, defaults, and information about input and output of an extension. That information is used for runtime validation when extensions are run.
An example `manifest.yaml` is below,

```yaml
name: example-extension
description: My example extension
input:
  basePath:
    type: string
    default: ./
    description: The path to be used
  clientId:
    type: string
    required: true
    description: The clientId to use. This is a required field that must be specified
output:
  apiUrl:
    type: string
    description: The apiUrl that was generated
```
## Required Input & Output

## Defining Custom Commands

## Publishing Extensions

# Packages

Descriptions of the packages within this monorepo.

## Extension Runner

The Extension Runner is a CLI that encompasses a few different responsibilities:

1. Orchestrate any number of extension configurations to ensure they run in the order needed for dependencies on each other.
2. Managing the Docker network that all extensions are attached to.
3. Running the Extension Control Plane that extensions use to access credentials, state, and logging capabilities.

Currently the extension CLI will read a `serverless.yml` file and parse extension definitions from that file. A bare minimum example configuration file that the extension CLI will read is,


```yaml
service: basic-service

my-extension-instance:
    extension: example-extension@0.0.1
    input:
        name: my-extension
```