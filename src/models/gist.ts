interface GistFile {
    [key: string]: {
        filename: string;
    };
}

export default interface Gist {
    id: string;
    owner: { login: string };
    files: GistFile;
}
