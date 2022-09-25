import Bluebird from 'bluebird';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import gitHelper from 'git-command-helper';
import { basename, dirname, join } from 'upath';
import { color } from '../color';
import HelperFTP, { isWin } from './helper';
import killProcessByName from './kill-process-by-name';
export default class LFTP extends HelperFTP {
    user;
    password;
    protocol = 'ftp';
    port = 21;
    host;
    cwd = '';
    /**
     * temp folder
     */
    tmp = join(process.cwd(), 'tmp');
    static lftpPath;
    constructor(config) {
        super();
        this.user = config.user;
        this.password = config.password;
        this.host = config.host;
        this.resolveLFTP();
        if (!existsSync(this.tmp))
            mkdirSync(this.tmp, { recursive: true });
    }
    async resolveLFTP() {
        if (typeof LFTP.lftpPath !== 'string') {
            const lftp = await gitHelper.shell(isWin ? 'where' : 'which', ['lftp'], {
                stdio: 'pipe'
            });
            const lftp_1 = (lftp || '').split(/\n/)[0];
            if (lftp_1.length > 0) {
                LFTP.lftpPath = lftp_1;
            }
        }
        killProcessByName('lftp');
        return typeof LFTP.lftpPath === 'string';
    }
    spawner(commands) {
        return new Bluebird((resolve, reject) => {
            this.resolveLFTP()
                .then((exists) => {
                if (!exists) {
                    return reject(new Error('lftp path not found'));
                }
                const child = spawn(LFTP.lftpPath, [
                    this.escapeshell(`${this.protocol}://${this.user}:${this.password}@${this.host}:${this.port}`)
                ]);
                let data_line = '';
                child.stdout.on('data', (data) => {
                    data_line += data;
                });
                // do login
                child.stdin.write('set ssl:check-hostname no;\n');
                child.stdin.write('login ' + this.user + ' ' + this.password + ';\n');
                // cd cwd
                if (typeof this.cwd === 'string') {
                    child.stdin.write('cd ' + this.escapeshell(this.cwd) + ';\n');
                }
                // do action
                for (let i = 0; i < commands.length; i++) {
                    let cmd = commands[i];
                    if (!cmd.includes(';'))
                        cmd += ';';
                    if (!cmd.includes('\n'))
                        cmd += '\n';
                    child.stdin.write(cmd);
                }
                // do ending
                child.stdin.write('exit;\n');
                child.stdin.end();
                child.on('close', () => resolve(data_line));
            })
                .catch(reject);
        });
    }
    /**
     * Check connection
     * @returns
     */
    async check() {
        try {
            await this.list('/');
            return true;
        }
        catch (e) {
            return e;
        }
    }
    async download(remote, local) {
        const dir = dirname(remote);
        const filename = basename(remote);
        const child = this.spawner([
            'cd ' + this.escapeshell(dir) + ';\n',
            'get' +
                this.escapeshell(filename) +
                ' -o ' +
                this.escapeshell(local) +
                ';\n'
        ]);
        if (this.isverbose()) {
            child.then(() => console.log('file downloaded', color.blueBright(remote), '->', color.greenBright(local)));
        }
    }
    /**
     * list remote path
     * @param remotePath
     * @returns
     */
    list(remotePath) {
        this.cwd = remotePath;
        return new Bluebird((resolve) => {
            const child = this.spawner([
                'cd ' + this.escapeshell(remotePath) + ';\n',
                'ls;\n'
            ]);
            child.then((data) => resolve(this.processLS(data)));
        });
    }
    /**
     * read file from remote
     * @param remotePath
     * @param localPath save to local path
     * @returns
     */
    read(remotePath, localPath) {
        this.cwd = dirname(remotePath);
        if (typeof localPath !== 'string') {
            localPath = join(this.tmp, dirname(remotePath).replace(/^\/(www|root|chdir)/, ''), remotePath.split('/')[remotePath.split('/').length - 1]);
            // console.log('save to', localPath);
        }
        return new Bluebird((resolve, reject) => {
            if (typeof localPath !== 'string') {
                return reject(new Error('localPath should be type of string'));
            }
            else {
                const child = this.spawner([
                    'get ' +
                        this.escapeshell(remotePath) +
                        ' -o ' +
                        this.escapeshell(localPath) +
                        ';\n'
                ]);
                child.then((_data) => {
                    const read = readFileSync(localPath).toString();
                    let result;
                    if (this.isJson(read)) {
                        result = JSON.parse(read);
                    }
                    else {
                        result = read;
                    }
                    resolve(result);
                });
            }
        });
    }
    /**
     * escape shell command
     * @param cmd
     * @returns
     */
    escapeshell(cmd) {
        if (typeof cmd !== 'string') {
            return '';
        }
        return cmd.replace(/([&"\s'$`\\;])/g, '\\$1');
    }
    /**
     * process ls result
     * @param message
     * @returns
     */
    processLS(message) {
        // console.log(message);
        return (message
            .split('\n')
            .map((str) => Array.from(str.matchAll(/([drwx-]{5,10})\s+(\d{1,4})\s+(\d{2,9})\s+(\w{4,})\s+(\d{1,}\s+\w{3,}\s+\d{1,2}\s+[0-9:]{4,})\s+(\w.*$)/gm)))
            //.map((str) => str.split(/\s{2,4}/).filter((str) => str.length > 0))
            .filter((arr) => arr.length > 0)
            .map((matches) => {
            return matches.map((m) => {
                return {
                    type: typeof m[2] === 'undefined' || m[2] === '1' ? 'file' : 'folder',
                    permission: m[1],
                    fileCount: m[2],
                    size: m[3],
                    owner: m[4],
                    date: m[5],
                    name: m[6]
                };
            });
        }));
    }
}
