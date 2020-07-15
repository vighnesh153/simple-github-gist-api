# Simple Github Gist API

<p>
<img alt="npm" src="https://img.shields.io/npm/dt/simple-github-gist-api">
</p>

Use this promise, async-await based API to 
store data on your github gists without the 
need to make those tedious HTTP requests.

## Installation

npm i -S simple-github-gist-api

## Usage

### Import (In Typescript)
```ts
import { GithubGistApi } from 'simple-github-gist-api'
```

### Require (In Javascript)
```js
const { GithubGistApi } = require("simple-github-gist-api");
```

### Instantiate
```js
const gist = new GithubGistApi('PAT', 'APP-IDENTIFIER');
```
* [Generate](https://github.com/settings/tokens/new) a Github PAT with `gist` 
scope selected. Keep this a secret as an environment variable. This will be used 
to create and update the gists. 
* App-Identifier. You can make use of your Application name but make sure  
it is hyphen/underscore separated. 
> Do use same identifier when re-starting the application. This is the thing 
> that will be used to identify your previously stored Github Gist. For 
> different applications, use different identifiers, unless you want to share 
> the Github gist among applications.

### Read protection
```js
gist.isPublic = true;
```
Doing this will allow the gist to be read by anyone. Just like a public 
repository on Github. Setting it false, will allow both read and write 
only with Github PAT.

### CORS
```js
gist.allowCors = true;
```
If using on the server side, you can set it to false. But if you are, for 
some reason, using this package on front-end app, set it to `true`. This 
will, behind the scenes, use `https://cors-anywhere.herokuapp.com/` prefix 
to avoid CORS error. Heroku may sometimes be slow. Currently, working on a better 
way to make the request from front-end without getting CORS error.

### Gist initialization
The following just syncs up with the Github Gist server to fetch all the latest 
data. If running for the first time, it will create the gist for you with the 
above configurations.
```js
try {
    await gist.touch();
} catch (e) {
    // gist initialization failed.
    // console.log(e)
}
``` 

### Get all file names
```ts
const fileNames: string[] = gist.getFileNames();
```

### Create a file
The content of any file will always be string. If you want to have a json file, 
store its content as string marshalling(JSON.stringify) it to string.
```ts
gist.createFile('projects.json', '{ "a": 123 }')
```

### Get a file
```ts
const projectsFile = gist.getFile('projects.json');
```

### Get content of the file
```ts
const content = projectsFile.getContent();
```

### Overwrite the file with new content
```ts
projectsFile.overwrite('{ "a": 456 }');
```

### Save the file on the server.
```ts
await projectsFile.save();
```

### If multiple files have updates, you can bulk save all the files by
```ts
await gist.save();
```
