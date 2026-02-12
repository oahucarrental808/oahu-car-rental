/**
 * Exchange an authorization code for refresh token
 * Note: This script is deprecated. Use the localhost redirect URI method instead.
 * The localhost method automatically handles token exchange via the local server.
 */

import { execSync } from 'child_process';
import { google } from 'googleapis';

const code = process.argv[2];

if (!code) {
  console.error('Usage: node scripts/exchange-code-for-token.js <authorization-code>');
  console.error('\n⚠️  NOTE: This script is deprecated. Use the localhost redirect URI method instead.');
  console.error('The localhost method (get-gmail-refresh-token.cjs, get-drive-refresh-token.cjs, etc.)');
  console.error('automatically handles token exchange via a local server.');
  process.exit(1);
}

try {
  // Get credentials from Firebase
  console.log('Retrieving OAuth credentials from Firebase...');
  const clientId = execSync('firebase functions:secrets:access OAUTH_CLIENT_ID', { encoding: 'utf-8' }).trim();
  const clientSecret = execSync('firebase functions:secrets:access OAUTH_CLIENT_SECRET', { encoding: 'utf-8' }).trim();
  // Get redirect URI from Firebase secrets (should be localhost)
  const redirectUri = execSync('firebase functions:secrets:access OAUTH_REDIRECT_URI', { encoding: 'utf-8' }).trim() || 'http://localhost:5555/oauth2callback';

  console.log(`Client ID: ${clientId.substring(0, 30)}...`);
  console.log(`Redirect URI: ${redirectUri}\n`);

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  console.log('Exchanging authorization code for tokens...');
  const { tokens } = await oAuth2Client.getToken(code);

  console.log('\n✅ SUCCESS! Tokens received:\n');
  console.log('REFRESH TOKEN:');
  console.log(tokens.refresh_token || '(none - try again, ensure prompt=consent)');
  
  if (tokens.refresh_token) {
    console.log('\n📋 To update Firebase secret, run:');
    console.log(`echo "${tokens.refresh_token}" | firebase functions:secrets:set DRIVE_REFRESH_TOKEN`);
    console.log('\nThen redeploy functions:');
    console.log('firebase deploy --only functions');
  }
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  if (error.response?.data) {
    console.error('\nError details:');
    console.error(JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
