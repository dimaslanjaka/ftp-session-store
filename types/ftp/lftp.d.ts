import Bluebird from 'bluebird';
import Client from 'ftp';
import HelperFTP from './helper';
interface GenericObject {
    [key: string]: any;
}
export default class LFTP extends HelperFTP implements GenericObject {
    user: string | undefined;
    password: string | undefined;
    protocol: string;
    port: number;
    host: string | undefined;
    cwd: string;
    /**
     * temp folder
     */
    tmp: any;
    static lftpPath: string;
    constructor(config: Client.Options);
    private resolveLFTP;
    private spawner;
    /**
     * Check connection
     * @returns
     */
    check(): Promise<true | Error>;
    download(remote: string, local: string): Promise<void>;
    /**
     * list remote path
     * @param remotePath
     * @returns
     */
    list(remotePath: string): any;
    /**
     * read file from remote
     * @param remotePath
     * @param localPath save to local path
     * @returns
     */
    read<T = string | Record<string, any> | any[]>(remotePath: string, localPath?: string): Bluebird<T>;
    /**
     * escape shell command
     * @param cmd
     * @returns
     */
    escapeshell(cmd: string): string;
    /**
     * process ls result
     * @param message
     * @returns
     */
    private processLS;
}
export {};
