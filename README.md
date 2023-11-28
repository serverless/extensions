![github-readme-light-v2](https://github.com/serverless/EXT/assets/2752551/85d8f2c9-3ebb-4a1e-be9e-04df851f549a)

**Update - November 28th, 2023:** This initial release of EXT is designed for Extension developers. The upcoming Serverless Framework V.4 will enable the community to utilize Extensions. Start building your Extension by reviewing the documentation and exploring the included [./extensions](./extensions). Next, we'll launch a registry for easy publishing and consumption of Extensions.

# Overview
Use / make / monetize developer experiences that provision cloud use-cases, like:

- AWS S3 Static Websites
- AWS Kinesis Streaming Data Pipelines
- MongoDB Atlas Databases

EXT runs Extensions. An Extension is logic for deploying/automating a use-case, encapsulated in a container. Thanks to containerization, you can _use_ and _make_ Extensions written in any language, and compose them together via inputs and outputs.

Currently, Extensions are configured in `ext.yml`, like this:

```yaml
# A Service is a unit of organization containing one or multiple Extensions
service: my-website

# An instance of an Extension
website:
  # Extension
  extension: site@1.0.0
  # Extension global config
  config:
    src: ./src
```

Use the EXT CLI to run Actions on the Extensions declared, like `$ run`, `$ info`, or `$ remove`.

Overall, EXT is an evolution of "Infrastructure-as-Code", offering deployment of use-cases beyond individual cloud resources, new types of automation, and revenue sharing for all Extension makers to ensure long-term viability.

EXT will be packaged within the upcoming [Serverless Framework V.4](https://github.com/serverless/serverless), enabling its users to run Extensions with the Framework. The purpose of this stand-alone project is to enable you to build and run Extensions today, before SF V.4 is released.

# Using Extensions

This guide focuses on _using_ Extensions. Please note, the EXT project currently focuses on _creating_ Extensions. A Registry and Serverless Framework V.4 are coming shortly to greatly enhance usability.

## Examples

The quickest way to try Extensions is to use some of the examples in [./extensions](./extensions).

Each Extension in [./extensions](./extensions) contains an `./example` folder that includes an `ext.yml` file. This file declares an Instance of the example Extension, with default configuration, ready to deploy.

Clone this repository to run the example Extensions.

```
git clone https://github.com/serverless/EXT
```

## Docker

Each Extension is a container, allowing you to use/make Extensions in any language and run them anywhere. As a result, Docker is required to use EXT.

We recommend [installing Docker Desktop](https://www.docker.com/products/docker-desktop/) to get started with Docker, if you don't have it installed already.

## Building

Currently, you must build Extensions locally via Docker before you can use them, or specify an Extension container within a container registry (e.g. Docker Hub). This will change with our upcoming Extensions Registry.

If you have an Extension locally, within its root, run the `ext developer build` command to build the container image and make it available locally. Here is how that can be done using the `site` Extension within the [./extensions](./extensions):

```
cd extensions/site
ext developer build
```

## Configuring

In `ext.yml`, you can create an Instance of the Extension you wish to use (assuming you've built it locally).

The name of the Extension is specified within the `manifest.yml` located in the root of each Extension. The global configuration options are also specified within that file. If you're familiar with Javascript, this global config is alike arguments passed into the constructor of a class.

An Instance of an Extension can be declared and configured like this:

```yaml
# A Service is a unit of organization containing one or multiple Extensions
service: my-website

# An instance of an Extension
website:
  # Extension
  extension: site@1.0.0
  # Extension global config
  config:
    src: ./src
```

## Credentials

For providing credentials Extensions may use, EXT can pick up environment variables set in your current terminal session and inject them into Extension containers. Currently, only credentials for AWS are supported. Request other credentials within the issues section of this repository.

## Actions

Each Extension comes with Actions which are functions that can be run to perform various types of automation within the Extension, like deployments, removals, etc.

The `run` Action is required by every Extension. Also common is the `info` Action, which reports useful state information and the `remove` Action, which removes infrastructure or anything deployed/created by the Extension.

Use the EXT CLI to perform Actions, like this:

```
ext run
ext info
ext remove
```

# Building Extensions

EXT requires Docker. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/),if you don't have it already.

Next, install the EXT CLI.

```
npm i -g @serverless/ext
```

Use the CLI to create a new extension using our typescript template.

```
ext developer new my-template serverless-extensions/template-typescript
```

Your new extension will now be available at `./my-template`, go ahead and install the dependencies

```
cd my-template
npm i
```

To run the EXT CLI, during this initial release, you must use `npx` from within the template project. Try it:

```
ext
```

You're ready to start building and running your first Extension!

Check out the Extension Template's code to get a quick sense of what an Extension looks like. At a high level, they are just groups of scripts, that can easily store state, print nicely formatted logs, and return with clear success or failure.

Extension Templates are ready to build and run, out-of-the-box. First, you must build the container the Template includes. If you look in the Dockerfile, you can see the build steps that happen as you do this:

```
ext developer build
```

Within the Extension Template is an `example` folder containing a `serverless.yml`. This is a Service, where Instances of Extensions are declared and configured. If you want to run or test Extensions, this is the required file.

The Extension Template already has a single Instance of this Extension specified. So, try creating an Instance of the Extension you just built, and running it. This will go show off the example logic within the Template:

```
cd example
ext run
```

Every Extension has Actions (e.g. commands). `run` is the only default/required Action for an Extension.

Extensions should also come with an `info` Action, which shows essential State. Run it:

```
ext info
```

Lastly, Extensions (if provisioning something) should come with a `remove` Action. Run it:

```
ext remove
```

Verify State was removed. You should see `undefined` values:

```
ext info
```

You've successfully run multiple Actions of an Extension!

Now, start modifying the Extension Template. The Template is filled with useful examples and comments. Remember, after every change, you must re-build the container `npx ext developer build`. We are aware this takes a few seconds and have plans to speed this up soon.
