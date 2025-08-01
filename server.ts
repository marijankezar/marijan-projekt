import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Let's Encrypt Zertifikate für kezar.at
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/kezar.at/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/kezar.at/fullchain.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(443, () => {
    console.log('✅ HTTPS-Server läuft auf https://kezar.at');
  });
});
