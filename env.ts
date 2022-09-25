//import 'dotenv/config';
import 'dotenv/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import SuperiorFtp from './src/ftp';
import './src/types/index';

/**
 * ENVIRONTMET FOR TESTING
 */

if (!existsSync(join(__dirname, 'tmp'))) mkdirSync(join(__dirname, 'tmp'));

const ProjectEnv = process.env;

export default ProjectEnv;
export const ftpInfo = {
  host: process.env.FTP_HOST,
  port: parseInt(process.env.FTP_PORT || '21'),
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  protocol: process.env.FTP_PROTOCOL,
  root: process.env.FTP_PATH
};
export const backend_ftp = new SuperiorFtp(
  Object.assign(ftpInfo, { connTimeout: 60 * 1000 })
);
