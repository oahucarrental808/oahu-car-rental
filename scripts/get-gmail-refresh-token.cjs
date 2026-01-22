const http = require("http");
const { google } = require("googleapis");
const { exec } = require("child_process");

const PORT = 5555;

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET env vars first.");
  process.exit(1);
}

const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Only need gmail.send
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/gmail.send",
];
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url.startsWith("/oauth2callback")) {
      res.writeHead(302, { Location: authUrl });
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get("code");
    if (!code) {
      res.end("No code in callback.");
      return;
    }

    const { tokens } = await oAuth2Client.getToken(code);

    res.end("Success! Check your terminal for refresh_token. You can close this tab.");
    server.close();

    console.log("\nTOKENS:\n", tokens);
    console.log("\nREFRESH TOKEN:\n", tokens.refresh_token || "(none - try again, ensure prompt=consent)");
  } catch (e) {
    console.error(e);
    res.end("Error; check terminal.");
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`\nOpening browser for consent:\n${authUrl}\n`);
  openBrowser(authUrl);
});
