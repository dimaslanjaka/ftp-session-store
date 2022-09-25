import 'dotenv/config';
import { FTP } from './ftp';

const ftp = new FTP({
  host: process.env.FTP_HOST,
  port: parseInt(process.env.FTP_PORT),
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS
});

ftp.check().then(console.log).catch(console.trace);
