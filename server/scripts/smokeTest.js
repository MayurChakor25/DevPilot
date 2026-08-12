/* Temporary local smoke test - not part of production app. Spins up an
 * in-memory MongoDB, starts the Express app, and exercises the main flows:
 * register -> login -> me -> upload zip -> chat (mocked Gemini) -> delete.
 * Run with: node scripts/smokeTest.js
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.GEMINI_API_KEY = 'test-key';

const path = require('path');
const fs = require('fs');
const http = require('http');

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('devpilot-test');

  // Mock Gemini before app.js (and its dependents) require it.
  const geminiServicePath = path.join(__dirname, '..', 'services', 'geminiService.js');
  require.cache[require.resolve(geminiServicePath)] = {
    id: geminiServicePath,
    filename: geminiServicePath,
    loaded: true,
    exports: {
      generateContent: async (prompt) => `# Mock AI Response\n\nThis is a mocked markdown response.\n\nPrompt length: ${prompt.length}`,
    },
  };

  const app = require('../app');
  const connectDB = require('../config/db');
  await connectDB();

  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const fetchJson = async (method, urlPath, body, token) => {
    const res = await fetch(`${base}${urlPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  };

  console.log('--- Health check ---');
  console.log(await fetchJson('GET', '/api/health'));

  console.log('--- Register ---');
  const registerRes = await fetchJson('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  });
  console.log(registerRes.status, registerRes.json.success, registerRes.json.message);
  const token = registerRes.json.data.token;

  console.log('--- Duplicate register (expect 409) ---');
  const dupRes = await fetchJson('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  });
  console.log(dupRes.status, dupRes.json.message);

  console.log('--- Login ---');
  const loginRes = await fetchJson('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  console.log(loginRes.status, loginRes.json.success);

  console.log('--- Login wrong password (expect 401) ---');
  const badLoginRes = await fetchJson('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'wrongpass',
  });
  console.log(badLoginRes.status, badLoginRes.json.message);

  console.log('--- Me ---');
  console.log(await fetchJson('GET', '/api/auth/me', null, token));

  console.log('--- Me without token (expect 401) ---');
  console.log(await fetchJson('GET', '/api/auth/me'));

  console.log('--- List repositories (empty) ---');
  console.log(await fetchJson('GET', '/api/repositories', null, token));

  console.log('--- Upload ZIP repository ---');
  const zipPath = path.join(__dirname, 'fixtures', 'sample-repo.zip');
  const zipBuffer = fs.readFileSync(zipPath);
  const form = new FormData();
  form.append('file', new Blob([zipBuffer]), 'sample-repo.zip');
  const uploadRes = await fetch(`${base}/api/repositories/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const uploadJson = await uploadRes.json();
  console.log(uploadRes.status, uploadJson.success, uploadJson.data && uploadJson.data.repository.status);
  const repoId = uploadJson.data.repository._id;
  console.log('stats:', uploadJson.data.repository.stats);

  console.log('--- Get repository ---');
  const getRepoRes = await fetchJson('GET', `/api/repositories/${repoId}`, null, token);
  console.log(getRepoRes.status, getRepoRes.json.data.repository.fileTree.length, 'file tree entries');

  console.log('--- AI chat ---');
  const chatRes = await fetchJson(
    'POST',
    '/api/ai/chat',
    { repoId, question: 'What does this project do?' },
    token
  );
  console.log(chatRes.status, chatRes.json.success);
  console.log(chatRes.json.data && chatRes.json.data.conversation.answer.slice(0, 60));

  console.log('--- Generate README ---');
  const readmeRes = await fetchJson('POST', '/api/ai/generate-readme', { repoId }, token);
  console.log(readmeRes.status, readmeRes.json.success);

  console.log('--- Generate README (nested alias route) ---');
  const readmeAliasRes = await fetchJson('POST', `/api/repositories/${repoId}/generate-readme`, {}, token);
  console.log(readmeAliasRes.status, readmeAliasRes.json.success);

  console.log('--- Generate docs ---');
  console.log((await fetchJson('POST', '/api/ai/generate-docs', { repoId }, token)).status);

  console.log('--- Find bugs ---');
  console.log((await fetchJson('POST', '/api/ai/find-bugs', { repoId }, token)).status);

  console.log('--- Conversations ---');
  const convRes = await fetchJson('GET', `/api/conversations/${repoId}`, null, token);
  console.log(convRes.status, convRes.json.data.conversations.length, 'conversations stored');

  console.log('--- Import invalid GitHub URL (expect 400) ---');
  console.log((await fetchJson('POST', '/api/repositories/import-github', { url: 'not-a-url' }, token)).status);

  console.log('--- Delete repository ---');
  const delRes = await fetch(`${base}/api/repositories/${repoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(delRes.status, (await delRes.json()).success);

  console.log('--- 404 route ---');
  console.log((await fetchJson('GET', '/api/does-not-exist')).status);

  server.close();
  await mongod.stop();
  console.log('\n✅ Smoke test completed successfully');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
