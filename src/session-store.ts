import debugLib from 'debug';
import { SessionData, Store } from 'express-session';
import {
  existsSync,
  mkdirSync,
  readdir,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs';
import persistentCache from 'persistent-cache';
import { basename, dirname, join } from 'upath';
import SuperiorFtp, { SuperiorFtpOptions } from './ftp';
import { hour2millis } from './session-store-helper';

const debug = debugLib('session-store-ftp');
/**
 * In-memory cache
 */
const cache = persistentCache({
  base: join(__dirname, '../tmp'),
  persist: false
});
interface ObjectCache {
  lastAccess: number;
}

type SessionStoreOptions = {
  [key: string]: any;
  path: string;
  connection: SuperiorFtpOptions;
};

export class SessionStore extends Store {
  options: SessionStoreOptions;
  ftp: SuperiorFtp;
  constructor(options: SessionStoreOptions) {
    super();
    this.options = options;
    if (!existsSync(options.path)) {
      debug('create local session directory');
      mkdirSync(options.path, { recursive: true });
    }
    if (typeof options.connection === 'object') {
      this.ftp = new SuperiorFtp(options.connection);
    }

    // register exit
    debug('register exit handler');
    const self = this;
    const exitHandler = terminate(async function () {
      const files = readdirSync(self.options.path).map((filename) => {
        return {
          path: join(self.options.path, filename),
          sid: basename(filename, '.json')
        };
      });
      while (files.length > 0) {
        const item = files[0];
        debug('uploading', item.sid);
        await self.upload(item.sid);
        files.shift();
      }
    });
    process.on('uncaughtException', exitHandler(1, 'Unexpected Error'));
    process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'));
    process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
    process.on('SIGINT', exitHandler(0, 'SIGINT'));
  }

  get(sid: string, callback: (err?: any, session?: SessionData) => void) {
    const cached = cache.getSync<ObjectCache>(sid);
    const getSession = () => {
      const sessionPath = this.getSessionPath(sid);
      const read = JSON.parse(readFileSync(sessionPath, 'utf-8'));
      callback(null, read);
    };
    // debug('get-cached', cached, Date.now());
    const _nHourAgo = (n: number) =>
      Date.now() - cached.lastAccess > hour2millis(n);
    // if not cached
    if (!cached) {
      this.download(sid).then(() => {
        getSession();
        cache.setSync(sid, <ObjectCache>{ lastAccess: Date.now() });
      });
    } else {
      getSession();
    }
  }

  /**
   * upload session to server
   * @param sid
   */
  private async upload(sid: string) {
    const sessionPath = this.getSessionPath(sid);
    if (typeof this.ftp !== 'undefined') {
      return await this.ftp
        .upload(
          sessionPath,
          join(this.options.connection.root, basename(sessionPath)),
          { recursive: true }
        )
        .catch(console.trace);
    }
  }

  private async download(sid: string) {
    const sessionPath = this.getSessionPath(sid);
    if (typeof this.ftp !== 'undefined') {
      return await this.ftp
        .download(
          join(this.options.connection.root, basename(sessionPath)),
          sessionPath
        )
        .catch(console.trace);
    }
  }

  set(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    //debug('set', sid);
    // debug('set', session);
    const sessionPath = this.getSessionPath(sid);
    writeFileSync(sessionPath, JSON.stringify(session));

    if (typeof callback === 'function') callback(null);
    // this.store.set(sid, session, callback);
  }

  private getSessionPath(sid: string) {
    const sessionPath = join(this.options.path, this.slugify(sid, '.json'));
    if (!existsSync(dirname(sessionPath))) {
      mkdirSync(dirname(sessionPath), { recursive: true });
    }
    if (!existsSync(sessionPath)) writeFileSync(sessionPath, '{}');
    return sessionPath;
  }

  private slugify(str: string, ext?: string) {
    if (ext) {
      if (!ext.startsWith('.')) ext = '.' + ext;
    }
    return (
      (
        str
          // lower case
          .toLowerCase()
          // remove special char except space, underscore, alphabetic, number
          .replace(/[^a-zA-Z0-9\s+\-_]/g, '')
          // replace whitespaces and underscore with single hypens
          .replace(/[\s\-_]+/g, '-')
          // replace multiple hypens with single hypens
          .replace(/-+/g, '-') + (ext || '')
      ).trim()
    );
  }

  touch(sid: string, session: SessionData, callback?: () => void): void {
    const self = this;
    this.get(sid, function (err, originalSession) {
      if (err) {
        return callback();
      }

      if (!originalSession) {
        originalSession = <any>{};
      }

      if (session.cookie) {
        // Update cookie details
        originalSession.cookie = session.cookie;
      }
      // Update property and save to store
      self.set(sid, originalSession, callback);
    });
  }

  length(callback: (err: any, length: number) => void): void {
    const self = this;
    readdir(this.options.path, function (err, files) {
      if (err) return callback(err, 0);

      var result = 0;
      files.forEach(function (file) {
        if (self.options.filePattern.exec(file)) {
          ++result;
        }
      });

      callback(null, result);
    });
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    const sessionPath = this.getSessionPath(sid);
    try {
      rmSync(sessionPath);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

function terminate(
  callback: CallableFunction,
  options = { coredump: false, timeout: 500 }
) {
  // Exit function
  const exit = (code: number) => {
    options.coredump ? process.abort() : process.exit(code);
  };

  return (code: number, reason: any) =>
    (err: Error, promise: Promise<unknown>) => {
      if (err && err instanceof Error) {
        // Log error information, use a proper logging library here :)
        debug(err.message, err.stack);
      }

      if (promise)
        debug('Unhandled rejection at ', promise, `reason: ${err.message}`);

      debug('attemp exit', reason, 'with code', code);

      // Attempt a graceful shutdown
      if (typeof callback === 'function') callback();
      setTimeout(() => exit(code), options.timeout).unref();
    };
}
