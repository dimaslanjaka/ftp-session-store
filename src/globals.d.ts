import 'express-session';
import './types';
declare module 'express-session' {
  interface SessionData {
    [key: string]: any;
    views: number;
  }
}
