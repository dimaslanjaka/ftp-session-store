import { SessionData, Store } from 'express-session';
import SuperiorFtp, { SuperiorFtpOptions } from './ftp';
declare type SessionStoreOptions = {
    [key: string]: any;
    path: string;
    connection: SuperiorFtpOptions;
};
export declare class SessionStore extends Store {
    options: SessionStoreOptions;
    ftp: SuperiorFtp;
    constructor(options: SessionStoreOptions);
    get(sid: string, callback: (err?: any, session?: SessionData) => void): void;
    /**
     * upload session to server
     * @param sid
     */
    private upload;
    private download;
    set(sid: string, session: SessionData, callback?: (err?: any) => void): void;
    private getSessionPath;
    private slugify;
    touch(sid: string, session: SessionData, callback?: () => void): void;
    length(callback: (err: any, length: number) => void): void;
    destroy(sid: string, callback?: (err?: any) => void): void;
}
export {};
