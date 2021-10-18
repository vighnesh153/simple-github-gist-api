import axios from "axios";

import getAuthConfig from "../util/auth-config";

import constants from "../constants";

interface GistFileOptions {
  personalAccessToken: string;
  gistId: string;
  gistOwner: string;

  fileName: string;
  fileContent: string;

  isPublic: boolean;

  cors?: {
    addPrefix?: boolean;
    customPrefix?: (url: string) => string;
  }
}

class GistFile {
  // Core
  private readonly personalAccessToken: string;
  private readonly gistId: string;
  private readonly gistOwner: string = '';
  private readonly fileName: string;
  private fileContent: string;
  private fileHasUpdates = false;

  // Config
  private readonly isPublic: boolean;
  private readonly addCorsPrefix: boolean;
  private readonly customCorsPrefix?: (url: string) => string;


  // Getters
  get hasUpdates(): boolean { return this.fileHasUpdates; }
  get name(): string { return this.fileName; }
  get content(): string { return this.fileContent; }

  // Setters
  set hasUpdates(value: boolean) { this.fileHasUpdates = value; };

  constructor(options: GistFileOptions) {
    this.personalAccessToken = options.personalAccessToken;
    this.gistId = options.gistId;
    this.gistOwner = options.gistOwner;

    this.fileName = options.fileName;
    this.fileContent = options.fileContent;

    this.isPublic = options.isPublic;

    this.addCorsPrefix = Boolean(options.cors?.addPrefix);
    this.customCorsPrefix = options.cors?.customPrefix;
  }

  /**
   * Over-write the file's content with new content
   *
   * @param newContent
   */
  overwrite = (newContent: string): void => {
    this.fileContent = newContent;
    this.fileHasUpdates = true;
  }

  /**
   * Save the gist-file
   */
  save = async (): Promise<void> => {
    if (this.hasUpdates === false) return;

    const url = `${constants.githubGists}/${this.gistId}`;
    const body = {
      public: this.isPublic,
      files: {
        [this.fileName]: {
          content: this.fileContent
        }
      }
    };

    try {
      await axios.post(url, body, getAuthConfig({ personalAccessToken: this.personalAccessToken }));
      this.fileHasUpdates = false;
    } catch (e) {
      throw new Error("Couldn't save file: " + this.fileName);
    }
  }

  /**
   * Fetch the latest version of the file
   */
  fetchLatest = async (): Promise<void> => {
    const latestCommit = await this.getLatestGistCommit();
    const url = this.getLatestGistFileFetchUrl(latestCommit);
    try {
      this.fileContent = await axios.get(url, getAuthConfig({ personalAccessToken: this.personalAccessToken }));
    } catch (e) {
      throw new Error("Couldn't fetch latest data of " + this.fileName);
    }
    this.fileHasUpdates = false;
  }

  /**
   * [Private Member] Returns the latest fetch url for the file. It gets updated on commit changes.
   *
   * @param commitId
   */
  private getLatestGistFileFetchUrl = (commitId: string): string => {
    const {addCorsPrefix, customCorsPrefix, gistOwner, gistId,} = this;

    const url = `https://gist.githubusercontent.com/${gistOwner}` +
      `/${gistId}/raw/${commitId}/${this.fileName}`;

    if (addCorsPrefix === false) return url;
    if (customCorsPrefix) return customCorsPrefix(url);
    return constants.corsAnywhere + url;
  }

  /**
   * Returns the latest commit of the gist
   */
  private getLatestGistCommit = async (): Promise<string> => {
    const dummyParam = `dummyParam=${ Math.random() }`; // So that we are not a victim of caching
    const url = `${constants.githubGists}/${this.gistId}?${dummyParam}`;
    try {
      const result = await axios.get<{ history: { version: string }[] }>(url, getAuthConfig({ personalAccessToken: this.personalAccessToken }));
      const response: { history: { version: string }[] } = result.data;
      const latestCommit = response.history[0];
      return latestCommit.version;
    } catch (e) {
      throw new Error('Error while fetching the latest commit.')
    }
  }
}

export default GistFile;
