import Bluebird from 'bluebird';
import debugLib from 'debug';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'upath';
import { FTP } from './ftp';
import HelperFTP from './helper';
import LFTP from './lftp';
const debug = debugLib('superior-ftp');
export default class SuperiorFtp extends HelperFTP {
    lftp;
    ftp;
    constructor(config) {
        super();
        this.ftp = new FTP(config);
        this.lftp = new LFTP(config);
    }
    async upload(localPath, remotePath, options) {
        let defaults = {
            recursive: false
        };
        if (typeof options === 'object') {
            defaults = Object.assign(defaults, options);
        }
        try {
            return await this.ftp.upload(localPath, remotePath);
        }
        catch (error) {
            if (error instanceof Error) {
                //console.log(error.message, Object.keys(error));
                if (/no such file/i.test(error.message)) {
                    if (defaults.recursive) {
                        debug('creating folder', dirname(remotePath));
                        await this.ftp.mkdir(dirname(remotePath));
                        return await this.upload(localPath, remotePath);
                    }
                }
            }
        }
    }
    /**
     * Check Connection
     * @returns
     */
    async check() {
        try {
            return await this.ftp.check();
        }
        catch {
            try {
                return await this.lftp.check();
            }
            catch {
                return new Error('check failed');
            }
        }
    }
    downloadSchedule = [];
    async download(remote, local) {
        if (!existsSync(dirname(local))) {
            mkdirSync(dirname(local), { recursive: true });
        }
        this.downloadSchedule.push({ remote, local });
        if (!this.downloadIndicator)
            await this.startDownload();
    }
    downloadIndicator = false;
    async startDownload() {
        // wait 1 sec to retry when previous download not completed
        if (this.downloadIndicator) {
            return setTimeout(() => {
                this.startDownload();
            }, 1000);
        }
        // skip download when schedule array data empty
        if (this.downloadSchedule.length === 0)
            return;
        // do download
        const obj = this.downloadSchedule[0];
        if (typeof obj === 'object') {
            this.downloadIndicator = true;
            if (!/\s/.test(obj.remote)) {
                await this.ftp.download(obj.remote, obj.local);
                this.downloadIndicator = false;
            }
            else {
                await this.lftp.download(obj.remote, obj.local);
                this.downloadIndicator = false;
            }
            this.downloadSchedule.shift();
            if (this.downloadSchedule.length > 0)
                return this.startDownload();
        }
    }
    exist(remotePath) {
        return this.ftp.list(remotePath);
    }
    list(remotePath) {
        return new Bluebird(async (resolve) => {
            this.ftp.list(remotePath).then((list) => {
                if (!Array.isArray(list) || list.length === 0) {
                    //return resolve((await this.lftp.list(remotePath)) as T);
                    this.lftp.list(remotePath).then((list) => {
                        // console.log('cannot resolve ftp, using lftp instead');
                        resolve(list.flat(1));
                    });
                }
                else {
                    resolve(list);
                }
            });
            //resolve(list as unknown as T);
        });
    }
    async read(remotePath, localPath) {
        try {
            return await this.ftp.read(remotePath);
        }
        catch (error) {
            return await this.lftp.read(remotePath, localPath);
        }
    }
}
