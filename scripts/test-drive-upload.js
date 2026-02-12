/**
 * Test script to verify OAuth refresh token works with Google Drive upload
 * This tests the full flow: token validation + actual Drive API operation
 */

import { execSync } from 'child_process';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Testing OAuth refresh token with Google Drive upload...\n');
console.log('='.repeat(60));

try {
  // Get credentials from Firebase
  console.log('\n1. Retrieving credentials from Firebase...');
  const clientId = execSync('firebase functions:secrets:access OAUTH_CLIENT_ID', { encoding: 'utf-8' }).trim();
  const clientSecret = execSync('firebase functions:secrets:access OAUTH_CLIENT_SECRET', { encoding: 'utf-8' }).trim();
  const redirectUri = execSync('firebase functions:secrets:access OAUTH_REDIRECT_URI', { encoding: 'utf-8' }).trim();
  const refreshToken = execSync('firebase functions:secrets:access DRIVE_REFRESH_TOKEN', { encoding: 'utf-8' }).trim();
  const parentFolderId = execSync('firebase functions:secrets:access DRIVE_PARENT_FOLDER_ID', { encoding: 'utf-8' }).trim();

  console.log(`   ✅ Client ID: ${clientId.substring(0, 30)}...`);
  console.log(`   ✅ Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`   ✅ Redirect URI: ${redirectUri}`);
  console.log(`   ✅ Refresh Token: ${refreshToken.substring(0, 30)}... (${refreshToken.length} chars)`);
  console.log(`   ✅ Parent Folder ID: ${parentFolderId}`);

  // Create OAuth client with exact Firebase credentials
  console.log('\n2. Creating OAuth client...');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Test 1: Validate token
  console.log('\n3. Validating OAuth token...');
  try {
    const accessToken = await oauth2Client.getAccessToken();
    if (accessToken.token) {
      console.log('   ✅ Token validation successful');
      console.log(`   Access token: ${accessToken.token.substring(0, 30)}...`);
    } else {
      console.log('   ❌ Token validation returned no token');
      process.exit(1);
    }
  } catch (error) {
    console.log('   ❌ Token validation failed:', error.message);
    if (error.response?.data) {
      console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }

  // Test 2: Create Drive API client
  console.log('\n4. Creating Google Drive API client...');
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  console.log('   ✅ Drive API client created');

  // Test 3: Create a contract subfolder (matching production behavior)
  console.log('\n5. Creating contract subfolder...');
  const testVin = 'TEST_VIN';
  const testStartDate = new Date().toISOString().split('T')[0];
  const testEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const folderName = `${testVin}_${testStartDate}_${testEndDate}`;
  
  let contractFolder;
  try {
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      fields: 'id, name, webViewLink',
    });
    contractFolder = folderResponse.data;
    console.log(`   ✅ Contract folder created: ${folderName}`);
    console.log(`   Folder ID: ${contractFolder.id}`);
    if (contractFolder.webViewLink) {
      console.log(`   Folder Link: ${contractFolder.webViewLink}`);
    }
  } catch (folderError) {
    console.log('   ❌ Failed to create contract folder:', folderError.message);
    if (folderError.response?.data) {
      console.log('   Error details:', JSON.stringify(folderError.response.data, null, 2));
    }
    process.exit(1);
  }

  // Test 4: Create a test file
  console.log('\n6. Creating test file...');
  const testFileName = `oauth-test-${Date.now()}.txt`;
  const testFilePath = path.join(rootDir, testFileName);
  const testContent = `OAuth Test File
Created: ${new Date().toISOString()}
This file tests OAuth token functionality with Google Drive.
`;
  
  fs.writeFileSync(testFilePath, testContent);
  console.log(`   ✅ Test file created: ${testFileName}`);

  // Test 5: Upload to Drive (inside contract folder)
  console.log('\n7. Uploading test file to contract folder...');
  try {
    const fileMetadata = {
      name: testFileName,
      parents: contractFolder.id ? [contractFolder.id] : undefined,
    };
    
    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath),
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, parents',
    });

    console.log('   ✅ File uploaded successfully!');
    console.log(`   File ID: ${uploadResponse.data.id}`);
    console.log(`   File Name: ${uploadResponse.data.name}`);
    if (uploadResponse.data.webViewLink) {
      console.log(`   View Link: ${uploadResponse.data.webViewLink}`);
    }
    if (uploadResponse.data.parents && uploadResponse.data.parents.length > 0) {
      console.log(`   Parent Folder (Contract Folder): ${uploadResponse.data.parents[0]}`);
    }

    // Test 6: Clean up - delete the test file and contract folder from Drive
    console.log('\n8. Cleaning up test file from Drive...');
    try {
      await drive.files.delete({
        fileId: uploadResponse.data.id,
      });
      console.log('   ✅ Test file deleted from Drive');
    } catch (deleteError) {
      console.log('   ⚠️  Could not delete test file from Drive:', deleteError.message);
      console.log(`   You may need to manually delete it: ${uploadResponse.data.webViewLink || uploadResponse.data.id}`);
    }

    console.log('\n9. Cleaning up contract folder from Drive...');
    try {
      await drive.files.delete({
        fileId: contractFolder.id,
      });
      console.log('   ✅ Contract folder deleted from Drive');
    } catch (deleteFolderError) {
      console.log('   ⚠️  Could not delete contract folder from Drive:', deleteFolderError.message);
      console.log(`   You may need to manually delete it: ${contractFolder.webViewLink || contractFolder.id}`);
    }

    // Clean up local test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('   ✅ Local test file deleted');
    } catch (unlinkError) {
      console.log('   ⚠️  Could not delete local test file:', unlinkError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SUCCESS! OAuth token works correctly with Google Drive API');
    console.log('   The token is valid and can be used in Firebase Functions.\n');
    process.exit(0);

  } catch (uploadError) {
    console.log('   ❌ File upload failed:', uploadError.message);
    if (uploadError.response?.data) {
      console.log('   Error details:', JSON.stringify(uploadError.response.data, null, 2));
    }
    
    // Clean up local test file
    try {
      fs.unlinkSync(testFilePath);
    } catch (unlinkError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  if (error.response?.data) {
    console.error('\nError details:');
    console.error(JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
