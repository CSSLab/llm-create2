// Local administrator preload. Reuses the Firebase CLI login in memory;
// never copies OAuth credentials into .env, audit records, or the application.
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

function findFirebaseTools() {
  if (process.env.FIREBASE_TOOLS_PATH) return process.env.FIREBASE_TOOLS_PATH;
  try {
    return path.dirname(require.resolve('firebase-tools/package.json'));
  } catch {
    for (const directory of (process.env.PATH || '').split(path.delimiter)) {
      const binary = path.join(directory, 'firebase');
      if (fs.existsSync(binary)) {
        const root = path.resolve(path.dirname(fs.realpathSync(binary)), '../..');
        if (fs.existsSync(path.join(root, 'lib/auth.js'))) return root;
      }
    }
  }
  throw new Error('Install the Firebase CLI or set FIREBASE_TOOLS_PATH to its package directory.');
}

const repoRoot = path.resolve(__dirname, '../../..');
const cliRoot = findFirebaseTools();
const auth = require(path.join(cliRoot, 'lib/auth'));
const api = require(path.join(cliRoot, 'lib/api'));
const account = auth.getProjectDefaultAccount(repoRoot) || auth.getGlobalDefaultAccount();
if (!account?.tokens?.refresh_token) {
  throw new Error('Firebase CLI is not logged in. Run firebase login first.');
}
const projectId = process.env.FIREBASE_CLI_PROJECT ||
  JSON.parse(fs.readFileSync(path.join(repoRoot, '.firebaserc'), 'utf8')).projects?.default;
if (!projectId) throw new Error('Set the default project in .firebaserc or FIREBASE_CLI_PROJECT.');
if (admin.apps.length) throw new Error('Load Firebase CLI authentication before initializing Firebase.');
admin.initializeApp({ projectId });
admin.firestore().settings({ credentials: {
  type: 'authorized_user',
  client_id: api.clientId(),
  client_secret: api.clientSecret(),
  refresh_token: account.tokens.refresh_token,
} });
console.log(JSON.stringify({ firebaseProject: projectId, authentication: 'existing Firebase CLI login' }));
