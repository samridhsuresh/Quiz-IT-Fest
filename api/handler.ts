import type { Request, Response } from 'express';
import app from '../src/server/app.ts';

export default function handler(req: Request, res: Response) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/handler') {
    const route = url.searchParams.get('__quiz_route') || '';
    if (/^[a-zA-Z0-9/_-]+$/.test(route)) {
      url.searchParams.delete('__quiz_route');
      req.url = '/api/' + route + url.search;
    }
  }
  app(req, res);
}
