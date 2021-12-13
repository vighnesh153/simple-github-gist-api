# Simple Github Gist API

[![npm (scoped)](https://img.shields.io/npm/v/simple-github-gist-api)](https://www.npmjs.com/package/simple-github-gist-api)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/simple-github-gist-api)](https://img.shields.io/bundlephobia/minzip/simple-github-gist-api)
[![npm](https://img.shields.io/npm/dt/simple-github-gist-api)](https://img.shields.io/npm/dt/simple-github-gist-api)
[![GitHub](https://img.shields.io/github/license/vighnesh153/simple-github-gist-api)](https://github.com/vighnesh153/simple-github-gist-api/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/vighnesh153/simple-github-gist-api)](https://github.com/vighnesh153/simple-github-gist-api/issues)

Use this promise based API to 
store data on your github gists without the 
need to make those tedious HTTP requests.

> Note: This documentation is for v2 of the lib. v2 has a few breaking changes. You can find the v1 documentation in the `docs` directory (On Github).

## Installation

```sh
npm i -S simple-github-gist-api
```

## Usage

### Import (In Typescript)
```ts
import GithubGist from 'simple-github-gist-api'
```

### Require (In Javascript)
```js
const GithubGist = require("simple-github-gist-api");
```

### Instantiate
* [Generate](https://github.com/settings/tokens/new?scopes=gist) a Github PAT with `gist`
  scope selected. Keep this a secret as an environment variable. This will be used
  to create and update the gists.

```js
const githubGist = new GithubGist({
  // Required
  personalAccessToken: 'YOUR-github-personal-access-token',

  // Required: App-Identifier -> You can make use of your Application 
  // name but make sure it is hyphen/underscore separated.
  appIdentifier: 'MyTestApp',
  
  // Optional: Doing this will allow the gist to be read by anyone. Just like a public 
  // repository on Github. Setting it false, will allow both read and write
  // only with Github PAT.
  isPublic: false,
  
  // Optional: If using on the server side, you can set it to false. But if you are, for 
  // some reason, using this package on front-end app, set it to `true`. This
  // will, behind the scenes, use `https://cors-anywhere.herokuapp.com/` prefix
  // to avoid CORS error. Note: Heroku may sometimes be slow. If you have your own
  // proxy server, you can use that as your custom prefix instead, too.
  cors: {
    addPrefix: true,
    customPrefix: (someURl) => `YourCustomPrefix` + someURl,
  },
});
```

> Do use same identifier when re-starting the application. This is the thing 
> that will be used to identify your previously stored Github Gist. For 
> different applications, use different identifiers, unless you want to share 
> the Github gist among applications.


### Gist initialization
The following just syncs up with the Github Gist server to fetch all the latest 
data. If running for the first time, it will create the gist for you with the 
above configurations.
```js
try {
    await githubGist.touch();

    console.log("Gist ID", githubGist.id);
    console.log("Github Owner Username", githubGist.ownerUsername);
} catch (e) {
    // gist initialization failed.
    // console.log(e)
}
``` 

### Get all file names
```ts
const fileNames: string[] = githubGist.getFileNames();
```

### Create a file
The content of any file will always be string. If you want to have a json file, 
store it's content by deserializing it via `JSON.stringify` or any method you prefer.
```ts
gist.createFile('projects.json', '{ "a": 123 }')
```

> Creates a file in the gist. If file already exists, it over-writes the
> content of the file.
>   Returns true, if the file was newly created.
>   Returns false, if the file already exists and over-writes its content


### Get a file
Returns the file instance.
```ts
const projectsFile = gist.getFile('projects.json');
```

### Get content of the file
Returns the file content.
```ts
const content: string = projectsFile.getContent();
```

### Overwrite the file with new content
```ts
projectsFile.overwrite('{ "a": 456 }');
```

### Save the file on the server.
```ts
await projectsFile.save();
```

### If multiple files have updates, you can bulk save all the files
```ts
await gist.save();
```
> Only files that have un-saved changes will be saved.

### Gotchas

Github Gist's API work on commit-id basis. If you save anything, 
it is a new commit and the commit-id changes. So, when you save, 
don't do that simultaneously. 

For instance, assume you have an endpoint `/create-file`. And if multiple people making request at the same time:
```
/create-file?name=1.json
/create-file?name=2.json
/create-file?name=3.json
...
```

then we cannot guarantee that the 
all the files will be saved. When creating `2.json` and `3.json`, there is a possibility 
that we make use of the same commit-id at HEAD. Both will work but 1 will over-write 
the other commit.
 
But if you do the following, it will work as the latest commit-id will be fetched when 
saving each file.
```ts
const file1 = gist.createFile('1.json', "{}")
const file2 = gist.createFile('2.json', "{}")
const file3 = gist.createFile('3.json', "{}")

await file1.save();
await file2.save();
await file3.save();
```

Or even this will work as well because all the changes will be pushed in a single commit.
```ts
gist.save();
```

### Sample
```ts
import GithubGist from "./src";

const personalAccessToken = "";

const githubGist = new GithubGist({
  appIdentifier: 'MyTestApp',
  personalAccessToken,
  cors: {
    addPrefix: true,
    customPrefix: (someURl) => `YourCustomPrefix` + someURl,
  },
});

(async () => {
  await githubGist.touch();

  console.log("Gist ID", githubGist.id);
  console.log("Github Username", githubGist.ownerUsername);

  console.log("Original File names", githubGist.getFileNames());

  const created = githubGist.createFile("projects.json", "{}");
  if (created) {
    console.log('Created new file in gist');
  } else {
    console.log('Updated existing file in gist');
  }

  // Note: All the creates and updates happen in-memory. You have to
  // explicitly invoke the `save` method on either the entire gist instance
  // or the individual file instance.

  // Saves all the files in the gist. Only the un-saved changes will be
  // added to the payload.
  await githubGist.save();

  // Save individual file.
  // const file = githubGist.getFile('projects.json');
  // await file.save();

  console.log("File names", githubGist.getFileNames());
})();
```
