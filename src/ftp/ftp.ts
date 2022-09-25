import Bluebird from 'bluebird';
import debugLib from 'debug';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import Client from 'ftp';
import { dirname } from 'path';
import HelperFTP from './helper';

const debug = debugLib('ftp');

export async function streamToString(stream: NodeJS.ReadableStream) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * @see {@link https://www.npmjs.com/package/ftp}
 */
export class FTP extends HelperFTP {
  conf: Client.Options;
  constructor(config: Client.Options) {
    super();
    this.conf = config;
  }

  /**
   * create directory
   * @param remotePath
   * @returns
   */
  mkdir(remotePath: string) {
    const self = this;

    return new Bluebird(
      (resolve: (...arg: any) => any, reject: (e: Error) => any) => {
        const c = new Client();
        c.on('ready', function () {
          c.mkdir(remotePath, true, (e) => {
            if (e instanceof Error) {
              reject(e);
            } else {
              resolve();
            }
          });
        });
        // connect to localhost:21 as anonymous
        c.connect(this.conf);
      }
    );
  }

  /**
   * read file from ftp
   * @param ftpPath
   * @returns
   */
  read<T = string | Record<string, any> | any[]>(ftpPath: string) {
    const self = this;

    return new Bluebird(
      (resolve: (arg: T) => any, reject: (e: Error) => any) => {
        const c = new Client();
        c.on('ready', function () {
          c.get(ftpPath, function (err, stream) {
            if (err) {
              reject(err);
            } else {
              streamToString(stream).then((data) => {
                if (self.isJson(data)) {
                  return resolve(JSON.parse(data));
                }
                resolve(data as unknown as T);
              });
            }
            if (typeof stream !== 'undefined') {
              stream.once('close', function () {
                c.end();
              });
            } else {
              c.end();
            }
          });
        });
        // connect to localhost:21 as anonymous
        c.connect(this.conf);
      }
    );
  }

  /**
   * download from remote to local
   * @param src
   * @param dest
   */
  download(src: string, dest: string) {
    return new Bluebird(
      (resolve: (arg: { data: string; path: string }) => any, reject) => {
        const c = new Client();
        c.on('error', (e) => {
          reject(e);
        });
        c.on('ready', function () {
          c.get(src, function (err, stream) {
            if (err) {
              reject(err);
            } else {
              if (!existsSync(dirname(dest))) {
                mkdirSync(dirname(dest), { recursive: true });
              }
              stream.pipe(createWriteStream(dest));
              streamToString(stream).then((data) =>
                resolve({
                  data,
                  path: dest
                })
              );
            }
            stream.once('close', function () {
              c.end();
            });
          });
        });
        // connect to localhost:21 as anonymous
        c.connect(this.conf);
      }
    );
  }

  /**
   * upload local src to remote dest
   * @param src local source
   * @param dest remote dest
   */
  upload(src: string | NodeJS.ReadableStream | Buffer, dest: string) {
    return new Bluebird((resolve: (result: boolean) => any, reject) => {
      const c = new Client();
      c.on('ready', function () {
        c.put(src, dest, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
          c.end();
        });
      });
      c.on('error', (e) => {
        reject(e);
      });
      // connect to localhost:21 as anonymous
      c.connect(this.conf);
    });
  }

  /**
   * Check connection
   */
  check() {
    return new Bluebird((resolve: (arg: Error | true) => any, reject) => {
      const c = new Client();
      c.on('ready', function () {
        resolve(true);
        c.end();
      });
      c.on('error', (e) => {
        reject(e);
      });
      // connect to localhost:21 as anonymous
      c.connect(this.conf);
    });
  }

  /**
   * list remote path
   * @param remotePath
   * @returns
   */
  list(remotePath: string | null) {
    return new Bluebird(
      (resolve: (arg: Client.ListingElement[]) => any, reject) => {
        const c = new Client();
        c.on('ready', function () {
          if (remotePath) {
            // list specific path
            c.list(remotePath, function (err, list) {
              //console.log('listing', dir, err, list);
              if (err) {
                reject(err);
              } else {
                resolve(list);
              }
              c.end();
            });
          } else {
            // list root directory
            c.list(function (err, list) {
              if (err) {
                reject(err);
              } else {
                resolve(list);
              }
              c.end();
            });
          }
        });
        c.connect(this.conf);
      }
    );
  }
}
