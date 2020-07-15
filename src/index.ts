import File from './models/file';
import Gist from './models/gist';
import GistAuthConfig from './models/gist-auth-config';

import required from './util/argument-not-specified';
import formattedGistIdentifier from './util/formatted-gist-identifier';
import isStringEmpty from './util/is-string-empty';

import validateToken from './token-validity';

import constants from './constants';
import { default as axios } from 'axios';

export const getHelloWorldString = (): string => {
    return 'Hello World!';
};

export class GithubGistApi {
    static __getHelloWorldString = getHelloWorldString;

    private readonly _gistIdentifierName: string;
    private _gistId: string = '';
    private _username: string = '';
    private _files: File[] = [];

    get gistId(): string {
        return this._gistId;
    }

    get username(): string {
        return this._username;
    }

    isPublic = false;
    allowCors = false;

    constructor(private personalAccessToken: string = required('personalAccessToken'),
                private _pureGistIdentifierName: string = required('gistIdentifierName')) {
        this._gistIdentifierName = formattedGistIdentifier(_pureGistIdentifierName);
    }

    async touch(): Promise<void> {
        await validateToken(this.personalAccessToken);
        await this._fetchGistIfExists();
        if (isStringEmpty(this._gistId)) {
            await this._createGistForFirstTime();
        }
    }

    createFile(name: string, initialContent: string): void {
        for (const file of this._files) {
            if (file.name === name) {
                throw new Error(`A file named ${name} already exists.`);
            }
        }
        const file = new File(this, name, initialContent);
        this._files.push(file);
    }

    getFile(name: string): File {
        for (const file of this._files) {
            if (file.name === name) {
                return file;
            }
        }
        throw new Error('No file found with name: ' + name);
    }

    getFileNames(): string[] {
        return this._files.map(file => file.name);
    }

    async save(): Promise<void> {
        const files: { [key: string]: { content: string } } = {};
        for (const file of this._files) {
            if (file.hasUpdates) {
                files[file.name] = {
                    content: file.getContent()
                }
            }
        }
        if (Object.keys(files).length === 0) {
            // All files are already updated
            return;
        }

        const url = `${constants.githubGists}/${this.gistId}`;
        const body = {
            public: this.isPublic,
            files
        };

        try {
            await axios.post(url, body, this._authConfig());
        } catch (e) {
            throw new Error('One or more files couldn\'t be saved.');
        }
    }

    private async _fetchGistIfExists(): Promise<void> {
        let result;
        try {
            result = await axios.get(constants.githubGists, this._authConfig());
        } catch (e) {
            throw new Error('Error while fetching gists.')
        }

        const gists: Gist[] = result.data;
        for (const gist of gists) {
            const fileNames = Object.keys(gist.files);
            if (fileNames.includes(this._gistIdentifierName)) {
                await this._selfInitialize(gist);
                break;
            }
        }
    }

    private async _createGistForFirstTime(): Promise<void> {
        const rootFileContent = constants.identifier
            .content.replace(
                '<APP-NAME>', this._pureGistIdentifierName
            );
        const data = {
            public: this.isPublic,
            files: {
                [this._gistIdentifierName]: {
                    content: rootFileContent
                }
            }
        };

        let result;
        try {
            result = await axios.post(
                constants.githubGists, data, this._authConfig()
            );
        } catch (e) {
            throw new Error('Error while creating the gist.')
        }

        await this._selfInitialize(result.data);
    }

    async _getLatestCommit(): Promise<string> {
        const dummyParam = `dummyParam=${ Math.random() }`;
        const url = `${constants.githubGists}/${this._gistId}?${dummyParam}`;
        try {
            const result = await axios.get(url, this._authConfig());
            const response: { history: { version: string }[] } = result.data;
            const latestCommit = response.history[0];
            return latestCommit.version;
        } catch (e) {
            throw new Error('Error while fetching the latest commit.')
        }
    }

    private async _selfInitialize(gist: Gist): Promise<void> {
        this._gistId = gist.id;
        this._username = gist.owner.login;
        for (const fileName in gist.files) {
            if (gist.files.hasOwnProperty(fileName)) {
                const file = new File(this, fileName, '');
                await file.fetchLatest();
                this._files.push(file);
            }
        }
    }

    _authConfig(): GistAuthConfig {
        return {
            headers: {Authorization: `token ${this.personalAccessToken}`}
        };
    }
}
