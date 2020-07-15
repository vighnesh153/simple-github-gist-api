import constants from '../constants';
import { GithubGistApi } from '../index';

import { default as axios } from 'axios';

export default class File {
    private _hasUpdates = true;
    get hasUpdates(): boolean {
        return this._hasUpdates;
    }

    get name(): string {
        return this._fileName;
    }

    constructor(private _rootRef: GithubGistApi,
                private _fileName: string,
                private _content: string) {
    }

    getContent(): string {
        return this._content;
    }

    overwrite(newContent: string): void {
        this._content = newContent;
        this._hasUpdates = true;
    }

    async save(): Promise<void> {
        const url = `${constants.githubGists}/${this._rootRef.gistId}`;
        const body = {
            public: this._rootRef.isPublic,
            files: {
                [this._fileName]: {
                    content: this._content
                }
            }
        };

        try {
            await axios.post(url, body, this._rootRef._authConfig());
        } catch (e) {
            throw new Error('Couldn\'t save file: ' + this._fileName);
        }
        this._hasUpdates = false;
    }

    async fetchLatest(): Promise<void> {
        const latestCommit = await this._rootRef._getLatestCommit();
        const url = this._latestFetchUrl(latestCommit);
        try {
            this._content = await axios.get(url, this._rootRef._authConfig());
        } catch (e) {
            throw new Error('Couldn\'t fetch latest data of ' + this._fileName);
        }
        this._hasUpdates = false;
    }

    private _latestFetchUrl(commitId: string): string {
        const {allowCors, username, gistId,} = this._rootRef;
        const corsPrefix = allowCors ? constants.corsAnywhere : '';
        return `${corsPrefix}` +
            `https://gist.githubusercontent.com/${username}` +
            `/${gistId}/raw/${commitId}/${this._fileName}`;
    }

}
