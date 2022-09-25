import SuperiorFtp from '.';
import { ftpInfo } from '../../env';

const ftp = new SuperiorFtp(ftpInfo);
ftp
  .read(process.env.FTP_PATH + '/chimeraland/recipes.json')
  .then(console.log)
  .catch(console.trace);
