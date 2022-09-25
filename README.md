# express-session-ftp
Express Session Store On FTP

## Example

```js
import express from 'express'; // const express = require('express');
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
  store: new SessionStore({
    path: join(__dirname, '../tmp/sessions'),
    connection: ftpInfo
  }),
  resave: true,
  saveUninitialized: false
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  // sess.cookie.secure = true; // serve secure cookies
  if ('cookie' in sess && typeof sess.cookie == 'object')
    sess.cookie.secure = true;
}

app.use(session(sess));
```

[Full Example](https://github.com/dimaslanjaka/express-session-ftp/blob/master/src/session-store.test.ts)