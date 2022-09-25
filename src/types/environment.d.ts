declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: any;
      FTP_USER: string;
      FTP_HOST: string;
      FTP_PASS: string;
      FTP_PATH: string;
      FTP_PORT: string;
      NODE_ENV: 'test' | 'dev' | 'prod' | 'development' | 'production';
    }
  }
}

export type x = any;
