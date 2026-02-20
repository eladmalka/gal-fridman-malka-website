import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.cache', '.config', '.upm', 'uploads', '.local', 'scripts']);
const IGNORE_FILES = new Set(['.replit', 'replit.nix', '.replit.nix', 'replit.md']);

function getAllFiles(dir: string, base: string = ''): { path: string; fullPath: string }[] {
  const results: { path: string; fullPath: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        results.push(...getAllFiles(fullPath, relPath));
      }
    } else if (entry.isFile()) {
      if (!IGNORE_FILES.has(entry.name) && !entry.name.startsWith('.gitkeep')) {
        results.push({ path: relPath, fullPath });
      }
    }
  }
  return results;
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.mp4', '.mp3', '.pdf', '.zip']);
  return binaryExts.has(ext);
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  const owner = 'eladmalka';
  const repo = 'gal-fridman-malka-website';

  console.log('Collecting files...');
  const rootDir = '/home/runner/workspace';
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} files to upload`);

  console.log('Creating blobs...');
  const treeItems: any[] = [];
  
  const BATCH_SIZE = 5;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async (file) => {
      try {
        let content: string;
        let encoding: 'utf-8' | 'base64';
        if (isBinaryFile(file.fullPath)) {
          content = fs.readFileSync(file.fullPath).toString('base64');
          encoding = 'base64';
        } else {
          content = fs.readFileSync(file.fullPath, 'utf-8');
          encoding = 'utf-8';
        }
        const { data: blob } = await octokit.git.createBlob({ owner, repo, content, encoding });
        return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
      } catch (err: any) {
        console.error(`  Error: ${file.path}: ${err.message}`);
        return null;
      }
    }));
    treeItems.push(...results.filter(Boolean));
    console.log(`  Uploaded ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files...`);
  }

  console.log(`\nCreating tree with ${treeItems.length} items...`);
  const { data: tree } = await octokit.git.createTree({ owner, repo, tree: treeItems });

  console.log('Creating initial commit (orphan)...');
  const { data: commit } = await octokit.git.createCommit({
    owner, repo,
    message: 'Initial commit - Gal Fridman Malka website',
    tree: tree.sha,
    parents: [],
  });

  console.log('Creating main branch ref...');
  try {
    await octokit.git.createRef({
      owner, repo,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
    console.log('Created refs/heads/main');
  } catch (e: any) {
    console.log('main ref exists, updating...');
    await octokit.git.updateRef({
      owner, repo,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
    console.log('Updated refs/heads/main');
  }

  // Also set as default branch
  await octokit.repos.update({
    owner, repo,
    default_branch: 'main',
  });

  console.log(`\nDone! Repository: https://github.com/${owner}/${repo}`);
}

main().catch(console.error);
