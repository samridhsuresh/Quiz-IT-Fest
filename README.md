# Knowledge Arena

## Local development

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database dedicated to this app.
3. Run `npm run db:migrate` against a fresh database. For a database already initialized by AI Studio, keep its existing configuration and schema.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

Run `npm run lint` and `npm test` to verify the code. Use `npm run build` followed by `NODE_ENV=production npm start` to exercise the production server locally.

## Hosting

Vercel builds the Vite client and runs the existing Express API with PostgreSQL. Set the server-only `DATABASE_URL` in the production environment. The production build applies the committed database migrations. Set `NODE_OPTIONS=--experimental-require-module` on Vercel so the Firebase Admin dependency can load ES modules.

For Google sign-in, authorize the live hosting domain in the existing Firebase Authentication settings. The Question Bank requires a verified Google account on the `ADMIN_EMAILS` allowlist, which defaults to the original owner account. The optional AI question generator also requires a server-only `GEMINI_API_KEY`.
