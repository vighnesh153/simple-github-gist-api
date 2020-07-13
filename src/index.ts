export const getHelloWorldString = (): string => {
    return "Hello World!";
};

export class GithubGistApi {
    static __getHelloWorldString = getHelloWorldString;
}
