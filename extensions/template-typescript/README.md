# EXT: Typescript Template

This is an EXT Extension Template written in Typescript.

It is ready to run out-of-the-box and showcases ideal code architecture, useful utility logic and example configuration
files.

[Learn how to use it within the main EXT repo](https://github.com/serverless/ext).

## Getting Started

### 1. Build the Extension

Run the following command in the root of template-typescript directory to build the Extension:

```bash
serverless ext developer build
```

It will build the Docker image for the Extension with the tag `ext-template-typescript:latest`.

### 2. Run the Extension

First, `cd` into the example directory:

```bash
cd example
```

Then, run the following command to run all Extensions defined in `serverless.yml`:

```bash
serverless ext run
```

The Extension will be executed with the configuration provided in `serverless.yml`.
You will be prompted to enter a name, age, and whether you want to confirm the input.
This functionality of prompting for input, showing spinner while processing,
logging the output in the standard EXT format,
and more is provided by the `ext-utils` [package](https://www.npmjs.com/package/@serverless/ext-utils).

This is an example of how it is used in the Extension:

```javascript
const name = await Prompt({
    input: {
        message: 'What is your name?'
    }
})
```

After the Extension is executed,
the data you entered will be persisted in the local state file, in the `.extensions` directory.
This is also done by the `ext-utils` package.

```javascript
await StoreState({
    foo: 'bar',
    nestedObject: {
        fizz: 'buzz'
    },
    nestedArray: [
        'array-item1',
        'array-item2'
    ],
    user: {
        name,
        age
    }
})

```

You can try to change the config in `serverless.yml` now and run the Extension again.
```diff
org: your-serverless-framework-dashboard-org-name
service: new-service

extension-instance:
  # Set the extension name and version based on what's in the extension.yml
  extension: template-typescript@latest
  # Configure the extension instance
  config:
-   confirm: true
+   confirm: false
```

When you change the `confirm` in `serverless.yml` to `false`, the Extension will not prompt you for confirmation.

Now you can run `info` action.
The data from the state file will be used to show the last data persisted by the Extension.

```bash
serverless ext info
```

Extensions can also handle custom commands. To run an example custom command, run the following command:

```bash
serverless ext extension-instance custom-command John
```

The last standard (obligatory for every Extension) action is `remove`.
To run `remove` for all Extensions defined in `serverless.yml`, run the following command:

```bash
serverless ext remove
```

To see the complete code of the Extension, check the `src` directory.

## Key Components

### `extension.yml`

The essential file for your Extension.
It configures your Extension and informs users and EXT how to interact with it and what it can do.
Example of `extension.yml`:

```yaml
# The name of the extension. Users will reference this in their serverless.yml
name: your-extension-name

# The permissions required by the extension
permissions:
  - docker-build # Allows the extension to build Docker images in EXT runtime environment

# The configuration accepted by the extension
# Users can provide these in the `config` block of their serverless.yml for the extension instance
config:
  confirm:
    type: boolean
    description: Require confirmation before saving the user response

# Custom CLI commands provided by the extension
commands:
  - command: custom-command <name>
    description: A custom command example
```

### `Dockerfile`

As every Extension is a Docker image, a Dockerfile is necessary.
Here's an example of a Node.js Extension Dockerfile, but you can use any language you like:

```Dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npx tsc --noEmitOnError
RUN npx esbuild src/index.ts --bundle --platform=node --outfile=dist/app.js
ENTRYPOINT ["node", "dist/app.js"]
```

### Standard Commands

Each Extension must support three standard actions: `run`, `info`, and `remove`.
Extensions receive inputs as command-line argument in JSON format with the following structure (JSON Schema):

```
{
  "ExtensionExecutionData": {
    "type": "object",
    "properties": {
      "instanceName": {
        "description": "The name of the instance of the Extension.",
        "type": "string"
      },
      "action": {
        "description": "Array of action strings to be performed.",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "config": {
        "description": "Configuration object specific to the Extension instance defined in serverless.yml.",
        "type": "object"
      }
    },
    "required": ["instanceName", "action", "config"]
  }
}
```

## Using Extensions

Use Extensions through the serverless.yml file, defining the Extensions similarly to resources in other IaC systems.
Example serverless.yml with Extensions:

```yaml
org: your-serverless-dashboard-org
service: my-service

cdk-sqs:
  extension: cdk@latest
  config:
    region: us-east-2
    path: /cdk-sqs

message-publisher:
  extension: message-publisher@latest
  config:
    region: us-east-2
    queueUrl: ${output:cdk-sqs.ExampleStack.QueueUrl}
```

In this example, two Extensions are defined: cdk and message-publisher, each with a user-specified configuration.
Data can be passed from one Extension to another using ${output:instance-name:state-value-path} syntax.
The cdk extension is invoked first,
followed by message-publisher to use the value of `output:cdk-sqs.ExampleStack.QueueUrl`.

To execute `run`, `info`, or `remove` actions for all Extensions defined in serverless.yml,
use `serverless ext run`, `serverless ext info`, or `serverless ext remove`, respectively.
For actions on a specific Extension instance, append the instance name after `ext`, e.g., `serverless ext cdk-sqs run`.
This also applies to invoking custom actions defined in the commands section of `extension.yml`.
