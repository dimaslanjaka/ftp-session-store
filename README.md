# ftp-session-store

Express Session File Store On FTP. 

## Example

```js
import express from 'express'; // const express = require('express');
import session from 'express-session'; // const session = require('express-session');
import { join } from 'path';
import SessionStore from 'ftp-session-store'; // const SessionStore = require('ftp-session-store');

const app = express();
/**
 * @type {import('express-session')['SessionOptions']}
 */
const sess = {
  /**
   * generate session id by client IP and user agent
   * * Optional
   */
  genid: function (req) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress;
    const isValidIP = typeof ip === 'string' && ip.trim().length > 0;
    const ua = req.get('User-Agent');
    const isValidUA = typeof ua === 'string' && ua.trim().length > 0;
    if (isValidIP && isValidUA) {
      return String(ip + ua).replace(/[^a-zA-Z0-9]/gm, '');
    }
    if (isValidIP) {
      return String(ip).replace(/[^a-zA-Z0-9]/gm, '');
    }
    return 'uid';
  },
  secret: 'keyboard cat',
  cookie: {
    secure: false,
    // 1 day expiration example
    maxAge: 1 * 24 * 3600 * 1000
  },
  /** ftp session store (Required) */
  store: new SessionStore({
    // store folder
    path: join(__dirname, 'tmp/sessions'),
    // ftp connection information
    connection: {
      host: process.env.FTP_HOST,
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      protocol: process.env.FTP_PROTOCOL,
      root: process.env.FTP_PATH
    }
  }),
  resave: true,
  saveUninitialized: false
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  if ('cookie' in sess && typeof sess.cookie == 'object') {
    sess.cookie.secure = true;
  }
}

app.use(session(sess));
```

[Full Example](https://github.com/dimaslanjaka/express-session-ftp/blob/master/src/session-store.test.ts)
