# EXT

Use and make Developer Experiences that provision cloud infrastructure use-cases, like:

* Static websites on AWS S3
* Real-time data processing pipelines on AWS Kinesis
* MongoDB Atlas Databases

Consider EXT as the natural evolution of Infrastructure-as-Code.

EXT runs **Extensions**. An Extension is automation logic for a specific use-case, encapsulated in a container. Thanks to containerization, you can create or use Extensions written in any language, and compose them together via their inputs and outputs.

_This initial release is for internal Serverless Inc teammates only. The experience is currently limited to building and running your own Extension._

# Quick-Start

EXT requires Docker. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/),if you don't have it already.

EXT also uses containers hosted in Github's Package Registry. In this phase of internal testing, you must have access to Serverless Inc's Github Container Packages to fetch required containers. To get access, go to your Github account, click settings, create a Github Personal Access Token ("Classic") scoped to the `serverlessinc` org. Please note that new "Fine-Grained" Personal Access Tokens do not have container scopes for whatever reason, so create a "Classic" Access Token, and make sure it has `repo` and `write:packages` permissions.

Next, login via docker to the Github Packages Registry so that Docker can pull any required containers:

```
echo 'put-your-personal-access-token-here' | docker login ghcr.io -u [your-github-username] --password-stdin
```

(These steps will not be needed when this is all released publicly)

Next, clone the **Typescript Template**. You will use this to build and run your first Extension.

```
git clone https://github.com/serverless-extensions/template-typescript
```

In this phase of internal testing, you must also set a GITHUB_TOKEN environment variable to be able to fetch our private NPM modules (this will go away too).

```
export GITHUB_TOKEN=yourpersonalaccesstoken
```

The EXT CLI is included in this as a development dependency. `cd` into the template and install its dependencies:

```
cd template-typescript
npm i
```

To run the EXT CLI, during this initial release, you must use `npx` from within the template project. Try it:

```
npx ext
```

You're ready to start building and running your first Extension!

Check out the Extension Template's code to get a quick sense of what an Extension looks like. At a high level, they are just groups of scripts, that can easily store state, print nicely formatted logs, and return with clear success or failure.

Extension Templates are ready to build and run, out-of-the-box. First, you must build the container the Template includes. If you look in the Dockerfile, you can see the build steps that happen as you do this:

```
npx ext developer build
```

Within the Extension Template is an `example` folder containing a `serverless.yml`. This is a Service, where Instances of Extensions are declared and configured. If you want to run or test Extensions, this is the required file. 

The Extension Template already has a single Instance of this Extension specified. So, try creating an Instance of the Extension you just built, and running it. This will go show off the example logic within the Template:

```
cd example
npx ext run
```

Every Extension has Actions (e.g. commands). `run` is the only default/required Action for an Extension.

Extensions should also come with an `info` Action, which shows essential State. Run it:

```
npx ext info
```

Lastly, Extensions (if provisioning something) should come with a `destroy` Action. Run it:

```
npx ext destroy
```

Verify State was removed. You should see `undefined` values:

```
npx ext info
```

You've successfully run multiple Actions of an Extension!

Now, start modifying the Extension Template. The Template is filled with useful examples and comments. Remember, after every change, you must re-build the container `npx ext developer build`. We are aware this takes a few seconds and have plans to speed this up soon.
