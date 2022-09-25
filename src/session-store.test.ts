import debugLib from 'debug';
import express from 'express';
import session, { SessionOptions } from 'express-session';
import { join } from 'path';
import { ftpInfo } from '../env';
import { SessionStore } from './session-store';
import { day2millis } from './session-store-helper';

const debug = debugLib('session-store-ftp');

const app = express();
const sess: SessionOptions = {
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
    maxAge: day2millis(1)
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

app.all('/', (req: express.Request, res, next) => {
  return res.json(req.session);
});

app.get('/set', (req, res) => {
  const { params, query, path } = req;

  if (typeof query === 'object') {
    Object.keys(query).forEach((key) => {
      req.session[key] = query[key];
    });
  }

  res.redirect('/');
});

app.listen(4000, () => {
  debug('Session Test Unit Running on http://localhost:4000');
});
