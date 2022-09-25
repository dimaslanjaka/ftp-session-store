/// <reference types="node" />
/// <reference types="node" />
import Bluebird from 'bluebird';
import Client from 'ftp';
import HelperFTP from './helper';
export declare function streamToString(stream: NodeJS.ReadableStream): Promise<string>;
/**
 * @see {@link https://www.npmjs.com/package/ftp}
 */
export declare class FTP extends HelperFTP {
    conf: Client.Options;
    constructor(config: Client.Options);
    /**
     * create directory
     * @param remotePath
     * @returns
     */
    mkdir(remotePath: string): Bluebird<any>;
    /**
     * read file from ftp
     * @param ftpPath
     * @returns
     */
    read<T = string | Record<string, any> | any[]>(ftpPath: string): Bluebird<T>;
    /**
     * download from remote to local
     * @param src
     * @param dest
     */
    download(src: string, dest: string): Bluebird<{
        data: string;
        path: string;
    }>;
    /**
     * upload local src to remote dest
     * @param src local source
     * @param dest remote dest
     */
    upload(src: string | NodeJS.ReadableStream | Buffer, dest: string): Bluebird<boolean>;
    /**
     * Check connection
     */
    check(): Bluebird<true | Error>;
    /**
     * list remote path
     * @param remotePath
     * @returns
     */
    list(remotePath: string | null): Bluebird<Client.ListingElement[]>;
}
