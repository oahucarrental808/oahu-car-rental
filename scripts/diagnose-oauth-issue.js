/**
 * Diagnostic script to identify OAuth configuration issues
 * Compares local test vs deployed function behavior
 */

import { execSync } from 'child_process';
import { google } from 'googleapis';

console.log('🔍 OAuth Configuration Diagnostic\n');
console.log('='.repeat(50));

try {
  // Get credentials from Firebase
  console.log('\n1. Retrieving credentials from Firebase...');
  const clientId = execSync('firebase functions:secrets:access OAUTH_CLIENT_ID', { encoding: 'utf-8' }).trim();
  const clientSecret = execSync('firebase functions:secrets:access OAUTH_CLIENT_SECRET', { encoding: 'utf-8' }).trim();
  const redirectUri = execSync('firebase functions:secrets:access OAUTH_REDIRECT_URI', { encoding: 'utf-8' }).trim();
  const refreshToken = execSync('firebase functions:secrets:access DRIVE_REFRESH_TOKEN', { encoding: 'utf-8' }).trim();

  console.log(`   ✅ Client ID: ${clientId.substring(0, 30)}...`);
  console.log(`   ✅ Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`   ✅ Redirect URI: ${redirectUri}`);
  console.log(`   ✅ Refresh Token: ${refreshToken.substring(0, 30)}... (${refreshToken.length} chars)`);

  // Test 1: Try with the exact redirect URI from Firebase
  console.log('\n2. Testing with exact Firebase redirect URI...');
  try {
    const oauth1 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth1.setCredentials({ refresh_token: refreshToken });
    const token1 = await oauth1.getAccessToken();
    console.log('   ✅ SUCCESS with Firebase redirect URI');
  } catch (error) {
    console.log('   ❌ FAILED with Firebase redirect URI');
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Details: ${JSON.stringify(error.response.data)}`);
    }
  }

  // Test 2: Try with postmessage (common for server-side)
  console.log('\n3. Testing with postmessage redirect URI...');
  try {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'postmessage');
    oauth2.setCredentials({ refresh_token: refreshToken });
    const token2 = await oauth2.getAccessToken();
    console.log('   ✅ SUCCESS with postmessage redirect URI');
  } catch (error) {
    console.log('   ❌ FAILED with postmessage redirect URI');
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: Try without setting redirect URI (let library handle it)
  console.log('\n4. Testing without explicit redirect URI...');
  try {
    const oauth4 = new google.auth.OAuth2(clientId, clientSecret);
    oauth4.setCredentials({ refresh_token: refreshToken });
    const token4 = await oauth4.getAccessToken();
    console.log('   ✅ SUCCESS without explicit redirect URI');
  } catch (error) {
    console.log('   ❌ FAILED without explicit redirect URI');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Recommendations:');
  console.log('   1. Ensure the redirect URI is authorized in Google Cloud Console');
  console.log('   2. Go to: APIs & Services > Credentials > OAuth 2.0 Client IDs');
  console.log('   3. Edit your OAuth client and add authorized redirect URIs:');
  console.log(`      - ${redirectUri}`);
  console.log('      - postmessage (for server-side apps)');
  console.log('   4. If the token was generated with a different redirect URI, regenerate it');
  console.log('   5. Use localhost redirect URI for token generation (e.g., http://localhost:5555/oauth2callback)');

} catch (error) {
  console.error('\n❌ Diagnostic failed:', error.message);
  process.exit(1);
}
