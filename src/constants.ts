const constants = {
    githubRateLimit: 'https://api.github.com/rate_limit',
    githubGists: 'https://api.github.com/gists',
    corsAnywhere: 'https://cors-anywhere.herokuapp.com/',
    identifier: {
        prefix: '__',
        suffix: '-db-from-github-gist-api.txt',
        content: 'This is the persistent store for the <APP-NAME> app. ' +
            'Playing with this gist directly, may have adverse ' +
            'effects in your application.'
    },
};

export default constants;
