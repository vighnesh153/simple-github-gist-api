import axios from "axios";

import getAuthConfig from "../util/auth-config";
import validateToken from "../util/token-validity";
import isStringEmpty from "../util/is-string-empty";
import formattedGistIdentifier from "../util/formatted-gist-identifier";

import constants from "../constants";

import GistFile from "./GistFile";

interface IGistFile {
  [key: string]: {
    filename: string;
  };
}

interface IGist {
  id: string;
  owner: { login: string };
  files: IGistFile;
}

interface GithubGistOptions {
  /**
   * Head over to this link: https://github.com/settings/tokens/new?scopes=gist to create your personalAccessToken.
   * The "gist" scope is needed. Keep that token, a secret.
   */
  personalAccessToken: string;

  /**
   * A unique name to identify your app. This is used to identify which files in the gist are managed by this lib.
   * Be sure to use the same name everytime so that you are modifying same files from your previous session.
   *
   * Examples: my-chat-app, my-first-app
   *
   * Note: Do use same identifier when re-starting the application. This is the thing that will be used to identify
   * your previously stored file in the Gist. For different applications, use different identifiers, unless you want
   * to share the files in the gist among different applications.
   */
  appIdentifier: string;

  /**
   * Whether the gist should be private or public (If public, it would be accessible for reading to everyone)
   *
   * Default: undefined -> which means, Private
   */
  isPublic?: boolean;

  /**
   * CORS configuration: Not needed when using server-side.
   */
  cors?: {
    /**
     * Adds the default proxy-server prefix so that the URLs are not CORS blocked.
     *
     * For example: https://cors-anywhere.herokuapp.com/ as prefix to the Url.
     */
    addPrefix?: boolean;

    /**
     *  Gets the URL as argument. Feel free to decorate with any of your URLs and then
     *  return the decorated URL.
     */
    customPrefix?: (url: string) => string;
  }
}

class GithubGist {
  // Core
  private readonly personalAccessToken: string;
  private readonly appIdentifier: string;
  private readonly formattedAppIdentifier: string;
  private gistId: string = '';
  private gistOwner: string = '';
  private gistFiles: GistFile[] = [];

  // Config
  private readonly isPublic: boolean;
  private readonly addCorsPrefix: boolean;
  private readonly customCorsPrefix?: (url: string) => string;

  // Getters
  get id(): string { return this.gistId };
  get ownerUsername(): string { return this.gistOwner };

  constructor(options: GithubGistOptions) {
    this.personalAccessToken = options.personalAccessToken;
    this.appIdentifier = options.appIdentifier;
    this.formattedAppIdentifier = formattedGistIdentifier(options.appIdentifier);

    this.isPublic = Boolean(options.isPublic);
    this.addCorsPrefix = Boolean(options.cors?.addPrefix);
    this.customCorsPrefix = options.cors?.customPrefix;
  }

  /**
   * Syncs the gistInstance with Github server. Should be done only once,
   * right after instantiation of this class.
   */
  touch = async (): Promise<void> => {
    // Throws error if the token is not valid.
    await validateToken(this.personalAccessToken);

    // Fetch and set the gist ID
    await this.fetchGist();

    // If gist ID is not set, it means the Gist doesn't exist. Create a new gist
    if (isStringEmpty(this.gistId)) {
      await this.createGist();
    }
  };

  /**
   * Creates a file in the gist
   *
   * @param name
   * @param content
   */
  createFile = (name: string, content: string): void => {
    const existingFile = this.gistFiles.find((file) => file.name === name);
    if (existingFile) {
      throw new Error(`A file named ${name} already exists.`);
    }

    const file = this.constructGistFile(name, content);
    this.gistFiles.push(file);
  }

  /**
   * Get a particular file instance
   *
   * @param name
   */
  getFile = (name: string): GistFile => {
    const file = this.gistFiles.find((file) => file.name === name);
    if (file) return file;

    throw new Error('No file found with name: ' + name);
  }

  /**
   * Returns the names of all the files in the gist.
   */
  getFileNames = (): string[] => {
    return this.gistFiles.map(file => file.name);
  }

  /**
   * Saves all the files in the gist, only if they have updates
   */
  save = async (): Promise<void> => {
    const files: { [fileName: string]: { content: string } } = {};
    for (const file of this.gistFiles) {
      if (file.hasUpdates === false) continue;
      files[file.name] = {
        content: file.content,
      }
    }

    // No files need updates
    if (Object.keys(files).length === 0) return;

    const url = `${constants.githubGists}/${this.gistId}`;
    const body = {public: this.isPublic, files};

    try {
      await axios.post(url, body, getAuthConfig({ personalAccessToken: this.personalAccessToken }));

      // Mark the hasUpdates flag in all the files as false.
      this.gistFiles.forEach((file) => {
        file.hasUpdates = false;
      });
    } catch (e) {
      throw new Error(`Failed to save the files.`);
    }
  }

  /**
   * [Private Member] Fetches the gist information.
   */
  private fetchGist = async (): Promise<void> => {
    let result;
    try {
      // Gets all the gists basic information
      result = await axios.get<IGist[]>(constants.githubGists, getAuthConfig({ personalAccessToken: this.personalAccessToken }));
    } catch (e) {
      throw new Error('Error while fetching gists.')
    }

    const gists = result.data;
    for (const gist of gists) {
      const fileNames = Object.keys(gist.files);

      // If the formattedAppIdentifier file exists in gist, this is out gist.
      if (fileNames.includes(this.formattedAppIdentifier)) {
        await this.initialize(gist);
        break;
      }
    }
  };

  /**
   * [Private Member] Creates the gist
   */
  private createGist = async (): Promise<void> => {
    const { identifier: { content }, githubGists } = constants;

    const rootFileContent = content.replace('<APP-NAME>', this.appIdentifier);
    const payload = {
      public: this.isPublic,
      files: {
        [this.formattedAppIdentifier]: {
          content: rootFileContent
        }
      }
    };

    let result;
    try {
      result = await axios.post<IGist>(githubGists, payload, getAuthConfig({ personalAccessToken: this.personalAccessToken }));
    } catch (e) {
      throw new Error('Error while creating the gist.')
    }

    const gist = result.data;
    await this.initialize(gist);
  };

  /**
   * [Private Member] Initializes the instance with the information from server.
   * @param gist
   * @private
   */
  private initialize = async (gist: IGist): Promise<void> => {
    // Set gist meta
    this.gistId = gist.id;
    this.gistOwner = gist.owner.login;

    const fetchFileContent: Promise<void>[] = [];

    // Initialize all the files
    this.gistFiles = [];
    for (const fileName of Object.keys(gist.files)) {
      const file = this.constructGistFile(fileName, '');
      fetchFileContent.push(file.fetchLatest());
      this.gistFiles.push(file);
    }

    // Fetching content of all the files.
    await Promise.all(fetchFileContent);
  }

  /**
   * [Private Member] This constructs the GistFile instance
   * @param fileName
   * @param content
   */
  private constructGistFile = (fileName: string, content: string): GistFile => {
    return new GistFile({
      fileName,
      fileContent: content,
      gistId: this.gistId,
      gistOwner: this.gistOwner,
      cors: {
        addPrefix: this.addCorsPrefix,
        customPrefix: this.customCorsPrefix,
      },
      personalAccessToken: this.personalAccessToken,
      isPublic: this.isPublic,
    });
  };
}

export default GithubGist;
