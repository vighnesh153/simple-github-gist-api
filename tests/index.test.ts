import { GithubGistApi } from '../src';

const helloWorld = GithubGistApi.__getHelloWorldString;

it('should return Hello World!', function () {
    expect(helloWorld()).toBe("Hello World!");
});
