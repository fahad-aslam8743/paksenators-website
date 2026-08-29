/**
 * One-time helper: run this once locally to generate YOUTUBE_REFRESH_TOKEN.
 *
 * Usage:
 *   1. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your .env
 *      (from Google Cloud Console -> APIs & Services -> Credentials ->
 *      OAuth 2.0 Client ID, type "Desktop app" or "Web application" with
 *      redirect URI urn:ietf:wg:oauth:2.0:oob or http://localhost).
 *   2. Run:  npx tsx server/get-youtube-refresh-token.ts
 *   3. Open the printed URL, sign in with the Google account that owns
 *      the target YouTube channel, and approve access.
 *   4. Paste the authorization code shown back into this terminal.
 *   5. Copy the printed refresh token into YOUTUBE_REFRESH_TOKEN in .env.
 *
 * This script is not used by the running server — it's a local, one-time
 * setup tool. Safe to delete after you've captured the refresh token.
 */
import 'dotenv/config';
import { google } from 'googleapis';
import readline from 'readline';

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env before running this script.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube'],
});

console.log('\n1. Open this URL in a browser, signed in as the channel owner:\n');
console.log(authUrl);
console.log('\n2. Approve access, then copy the code shown on the page.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorization code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\nSuccess! Add this to your .env file:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (e) {
    console.error('Failed to exchange code for tokens:', e);
  } finally {
    rl.close();
  }
});
