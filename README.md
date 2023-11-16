![github-readme-light](https://github.com/serverless/EXT/assets/2752551/778b80a7-7d71-4122-8c73-cd184ff4a721)

# Overview
Use / make / monetize developer experiences that provision cloud use-cases, like:

- AWS S3 Static Websites
- AWS Kinesis Streaming Data Pipelines
- MongoDB Atlas Databases

EXT runs Extensions. An Extension is logic for deploying and automating a use-case, encapsulated in a container. Thanks to containerization, you can _run_ and _create_ Extensions written in any language, and compose them together via their inputs and outputs.

Currently, Extensions are configured in `ext.yml`, like this:

```yaml
# Unit of organization containing multiple Extensions
service: my-service

# An instance of an Extension
website:
  extension: aws-s3-website@1.0.0
  input:
    awsS3bucketName: 'website'
```

EXT is an evolution of "Infrastructure-as-Code", offering deployment of use-cases beyond individual cloud resources, new types of automation, and revenue sharing for all Extension makers to ensure long-term viability.

EXT will be included within the upcoming [Serverless Framework V.4](https://github.com/serverless/serverless), enabling its users to run Extensions with the Framework. The purpose of this stand-alone project is to enable you to build and run Extensions today, before V.4 comes out.
  
# Quick-Start

EXT requires Docker. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/),if you don't have it already.

Next, install the EXT CLI.

```
npm i -g @serverless/ext
```

Next, you can use the CLI to create a new extension using our typescript template.

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
