# EXT

**Run, Build & Share Developer Experiences.**


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