import { backend_ftp } from '../../env';

backend_ftp.check().then((result) => {
  if (typeof result === 'boolean') {
    backend_ftp
      .exist(process.env.FTP_PATH)
      .then(console.log)
      .catch(console.trace);
  }
});
