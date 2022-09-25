import * as Bluebird from 'bluebird';
import { ListingElement, Options } from 'ftp';
import { FTP } from './ftp';
import HelperFTP from './helper';
import LFTP from './lftp';
export declare type SuperiorFtpOptions = Options & {
    root: string;
};
export default class SuperiorFtp extends HelperFTP {
    lftp: LFTP;
    ftp: FTP;
    constructor(config: SuperiorFtpOptions);
    upload(localPath: string, remotePath: string, options?: {
        recursive: boolean;
    }): Promise<boolean>;
    /**
     * Check Connection
     * @returns
     */
    check(): Promise<true | Error>;
    private downloadSchedule;
    download(remote: string, local: string): Promise<void>;
    private downloadIndicator;
    private startDownload;
    exist(remotePath: string): Bluebird<ListingElement[]>;
    list(remotePath: string): Bluebird<ListingElement[]>;
    read<T>(remotePath: string, localPath?: string): Promise<Awaited<T>>;
}
