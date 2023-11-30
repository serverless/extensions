![github-readme-2-dark](https://github.com/serverless/EXT/assets/2752551/e1cf5026-63e0-4569-a5f3-c3e70caa325e)


## Update (November 30th, 2023)

Upcoming Serverless Framework V.4 will introduce **Extensions**, which enable new use-cases in the Framework. This initial release of the EXT project helps you build Extensions today. To start, explore the docs, [examples](./extensions) and [Typescript Template](./extensions/template-typescript). A registry for Extensions is also on the horizon for easier publishing and usage.

# Overview

<p align="center">
  <a href="https://youtu.be/jBIIKpUUxBs">
    <img src="https://github.com/serverless/EXT/assets/2752551/c2c5dff7-2a58-427c-8b4e-cf3ab9a8cf34" width="400" style="max-width: 100%; height: auto;">
  </a>
</p>

**EXT** is an innovative platform that is part of upcomfing Serverless Framework V.4. It enables developers to create, use, and monetize cloud-based infrastructure-as-code and general developer experiences, like deploying Static Websites on AWS S3, APIs on AWS Lambda and AWS Fargate, or MongoDB Atlas Databases.

EXT runs **Extensions**. An Extension is logic for deploying/automating a use-case, encapsulated in a container. Thanks to containerization, you can use Extensions anywhere, make them in any language, and compose them together via inputs and outputs.

Most notably, Extensions feature a revenue sharing model. EXT will be embedded within the upcoming [Serverless Framework V.4](https://github.com/serverless/serverless), and Serverless Inc. will share 80% of revenue generated from running your Extensions, with you. Now, you can easily distribute, monitor and monetize developer experiences to Serverless Framework's massive developer community, with less effort.

Consider EXT an evolution of "Infrastructure-as-Code", offering deployment of use-cases beyond individual cloud resources, new types of automation, and revenue sharing for all Extension makers to ensure long-term viability.

# Installation

EXT requires Docker. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/),if you don't have it already.

Next, you currently need Node.js installed on your machine, and then you can install the EXT CLI:

```
npm i -g @serverless/ext
```

EXT automatically updates itself. We recommend installing it once, globally.

# Using Extensions

Here is how to run Extensions. Please note, the EXT project currently focuses on _creating_ Extensions. A Registry and Serverless Framework V.4 integration are coming shortly to greatly enhance usability.

## Examples

The quickest way to try Extensions is to use some of the examples in [./extensions](./extensions).

Each Extension in [./extensions](./extensions) contains an `./example` folder that includes an `ext.yml` file. This file declares an Instance of the example Extension, with default configuration, ready to deploy.

Clone this repository to run the example Extensions.

```
git clone https://github.com/serverless/EXT
```

## Building

Currently, you must build each Extension locally via Docker before you can use it, or specify an Extension container within a container registry (e.g. Docker Hub). This will change with our upcoming Extensions Registry.

If you have an Extension locally, within its root, run the `ext developer build` command to build the container image and make it available locally. Here is how that can be done using the `site` Extension within the [./extensions](./extensions):

```
cd extensions/site
ext developer build
```

## Configuring

In `ext.yml`, you can create an Instance of the Extension you wish to use (assuming you've built it locally).

The name of the Extension is specified within the `extension.yml` located in the root of each Extension. The global configuration options are also specified within that file. If you're familiar with Javascript, this global config is alike arguments passed into the constructor of a class.

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

# Making Extensions

Here is how to quickly get started _making_ Extensions.

## Templates

Extension Templates are ready to build and run, out-of-the-box. We recommend starting with our [Typescript Template](./extensions/template-typescript). We have more templates coming soon for other languages.

Clone this repository to start using the Typescript Template.

Next, `cd` into it and install the dependencies:

```
cd my-template
npm i
```

Check out the Extension Template's code to get a quick sense of what an Extension looks like.

## Building

Templates are ready to run out-of-the-box, but first you must build the Extension container. Run this command within the root of the Extension to build it:

```
ext developer build
```

## Configuring

When making an Extension, it requires a `extension.yml` file, which declares the name and required configuration for the Extension. Create and adjust this to your requirements.

When using an Extension, it must be specified within an `ext.yml` file. This file is a Service, where Instances of Extensions are declared and configured, to be run together.

## Actions

The [Typescript Template](./extensions/template-typescript) contains an `example` folder containing an `ext.yml` which is ready to run. This will go show off the example logic within the Template:

```
cd example
ext run
```

Every Extension has Actions (e.g. commands). `run` is the only default/required Action for an Extension. When running the [Typescript Template](./extensions/template-typescript) it should save some state when its run.

Extensions should also come with an `info` Action, which shows essential State. The [Typescript Template](./extensions/template-typescript) should display essential state saved after `run` when `info` is run:

```
ext info
```

Lastly, Extensions (if provisioning something) should come with a `remove` Action.

```
ext remove
```

The [Typescript Template](./extensions/template-typescript) should remove the saved state after `remove` is run. Verify State was removed via `info`. You should see `undefined` values:

```
ext info
```

You've successfully run multiple Actions of an Extension!

Now, start modifying the Extension Template. The Template is filled with useful examples and comments. Remember, after every change, you must re-build the container `npx ext developer build`. We are aware this takes a few seconds and have plans to speed this up soon.

## Utils: Node.js & Typescript

EXT uses a control plane server to orchestrate and interact with Extension containers. This architecture allows Extensions to run anywhere and be truly portable and language agnostic.

Interacting with the control plane can be done manually via GRPC, but for greater ease, we're creating utility libraries you can use within your Extension.

The first utility library is available for use in Node.js or Typescript. Install it within your Extension via:

```
npm i @serverless/ext-utils
```

Here are the available methods:

### `Logger`
- **Description**: Provides logging capabilities within the extension.
- **Methods**:
  - `await Logger.debug(message)`: Logs a debug-level message.
  - `await Logger.info(message)`: Logs an informational message.
  - `await Logger.warning(message)`: Logs a warning message.

### `GetState`
- **Description**: Retrieves the current state of the extension.
- **Usage**: `const state = await GetState()`

### `StoreState`
- **Description**: Stores the provided state of the extension. Accepts an object. This object will overwrite all state, so be careful when passing in data via this method.
- **Arguments**:
  - `state` (Object): The state object to be stored.
- **Usage**: `await StoreState(state);`

### `ReportExecutionResult`
- **Description**: Reports the result of the extension's execution.
- **Arguments**:
  - `result` (Object): Contains the execution status and output state keys.
  - `result.status` (Number): `0` for success and `1` for failure. This will print a clear failure within the CLI, along with the error.
  - `result.error` (Error Object): Optional. Will only be used if `result.status` is `1`.
  - `result.outputStateKeys` (Array of strings): Specific State keys you wish to make available to other Extensions when the `run` Action is run, and to show up within the CLI.
- **Usage**: `await ReportExecutionResult({ status: 0, error, outputStateKeys: ['foo', 'bar', 'fizz.buzz'] });`

### `GetCredentials`
- **Description**: Retrieves credentials for the specified vendor that are available as environment variables within your current terminal session.
- **Arguments**:
  - `CredentialVendor` (Enum): An enum value representing the credential vendor (e.g., AWS).
- **Usage**: `const credentials = await GetCredentials(CredentialVendor.AWS);`

### `CredentialVendor`
- **Description**: Enum used in `GetCredentials` to specify the vendor for credentials.
- **Values**: Includes vendors like `AWS`.

## Revenue Share

Revenue sharing will be available upon Serverless Framework V.4 GA, planned for end of January 2024. At that time, you will be able to enroll in this.

Serverless Framework users will be charged per Instance of your Extension used. Extensions will initially have a fixed price. However, custom Extension pricing is planned for later 2024.
