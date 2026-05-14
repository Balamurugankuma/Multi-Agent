// ══════════════════════════════════════════════════════════
//  controllers/zipController.js  —  Velverse AI
//
//  POST /api/zip/generate
//    Collects the last N messages from a chat session,
//    extracts code blocks, builds a proper project structure,
//    and streams a ZIP file back to the client.
//
//  This works 100% with pure Node.js built-ins (no archiver).
//  Uses the ZIP spec directly: local file headers + central dir.
// ══════════════════════════════════════════════════════════
const zlib        = require('zlib');
const ChatHistory = require('../models/ChatHistory');

// ── CRC-32 table (for ZIP spec compliance) ─────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── Write little-endian integers ──────────────────────────
function writeU16(buf, off, val) { buf[off] = val & 0xFF; buf[off+1] = (val >> 8) & 0xFF; }
function writeU32(buf, off, val) {
  buf[off] = val & 0xFF; buf[off+1] = (val >> 8) & 0xFF;
  buf[off+2] = (val >> 16) & 0xFF; buf[off+3] = (val >> 24) & 0xFF;
}

// ── Build one ZIP entry (local file header + data) ───────
function zipEntry(filename, content) {
  const nameBytes = Buffer.from(filename, 'utf8');
  const dataBytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const crc       = crc32(dataBytes);
  const now       = new Date();
  const dosTime   = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds()/2));
  const dosDate   = (((now.getFullYear()-1980) << 9) | ((now.getMonth()+1) << 5) | now.getDate());

  // Local file header (30 bytes + name)
  const hdr = Buffer.alloc(30);
  writeU32(hdr,  0, 0x04034B50);  // signature
  writeU16(hdr,  4, 20);           // version needed (2.0)
  writeU16(hdr,  6, 0);            // flags
  writeU16(hdr,  8, 0);            // compression (stored)
  writeU16(hdr, 10, dosTime);
  writeU16(hdr, 12, dosDate);
  writeU32(hdr, 14, crc);
  writeU32(hdr, 18, dataBytes.length); // compressed size
  writeU32(hdr, 22, dataBytes.length); // uncompressed size
  writeU16(hdr, 26, nameBytes.length);
  writeU16(hdr, 28, 0);            // extra field length

  return {
    local: Buffer.concat([hdr, nameBytes, dataBytes]),
    meta:  { filename: nameBytes, crc, size: dataBytes.length, dosTime, dosDate },
  };
}

// ── Build central directory record ───────────────────────
function centralDirEntry(meta, localOffset) {
  const rec = Buffer.alloc(46);
  writeU32(rec,  0, 0x02014B50);  // signature
  writeU16(rec,  4, 20);           // version made by
  writeU16(rec,  6, 20);           // version needed
  writeU16(rec,  8, 0);
  writeU16(rec, 10, 0);            // stored
  writeU16(rec, 12, meta.dosTime);
  writeU16(rec, 14, meta.dosDate);
  writeU32(rec, 16, meta.crc);
  writeU32(rec, 20, meta.size);
  writeU32(rec, 24, meta.size);
  writeU16(rec, 28, meta.filename.length);
  writeU16(rec, 30, 0); writeU16(rec, 32, 0); writeU16(rec, 34, 0);
  writeU16(rec, 36, 0);
  writeU32(rec, 38, 0);            // external attributes
  writeU32(rec, 42, localOffset);  // offset of local header
  return Buffer.concat([rec, meta.filename]);
}

// ── Build end-of-central-directory record ────────────────
function endOfCentralDir(entryCount, cdSize, cdOffset) {
  const rec = Buffer.alloc(22);
  writeU32(rec,  0, 0x06054B50);
  writeU16(rec,  4, 0); writeU16(rec,  6, 0);
  writeU16(rec,  8, entryCount);
  writeU16(rec, 10, entryCount);
  writeU32(rec, 12, cdSize);
  writeU32(rec, 16, cdOffset);
  writeU16(rec, 20, 0);
  return rec;
}

// ── Assemble full ZIP buffer ──────────────────────────────
function buildZip(files) {
  // files: [{ path, content }]
  const entries = [];
  const offsets = [];
  let pos = 0;

  for (const f of files) {
    offsets.push(pos);
    const e = zipEntry(f.path, f.content);
    entries.push(e);
    pos += e.local.length;
  }

  const cdOffset = pos;
  const cdParts  = entries.map((e, i) => centralDirEntry(e.meta, offsets[i]));
  const cdSize   = cdParts.reduce((s, p) => s + p.length, 0);
  const eocd     = endOfCentralDir(entries.length, cdSize, cdOffset);

  return Buffer.concat([
    ...entries.map(e => e.local),
    ...cdParts,
    eocd,
  ]);
}

// ══════════════════════════════════════════════════════════
//  Code extraction: pull fenced code blocks from AI text
// ══════════════════════════════════════════════════════════
const EXT_MAP = {
  javascript: 'js',   js:       'js',  jsx:       'jsx',
  typescript: 'ts',   ts:       'ts',  tsx:       'tsx',
  python:     'py',   py:       'py',  java:      'java',
  css:        'css',  html:     'html', json:     'json',
  bash:       'sh',   shell:    'sh',  sql:       'sql',
  yaml:       'yml',  yml:      'yml', markdown:  'md',
  md:         'md',   text:     'txt', plaintext: 'txt',
};

const FILENAME_PATTERNS = [
  // // server.js   or  ## server.js
  /(?:\/\/|##|#)\s+([\w/.\-]+\.[a-zA-Z]{1,5})/,
  // // FILE: server.js
  /(?:FILE|file|filename|Filename):\s*([\w/.\-]+\.[a-zA-Z]{1,5})/,
  // --- server.js ---
  /^---\s+([\w/.\-]+\.[a-zA-Z]{1,5})\s+---/m,
];

function extractFiles(text) {
  const files = [];
  const seen   = new Set();

  // Match ``` fenced blocks
  const fence = /```(\w+)?\n([\s\S]*?)```/g;
  let m; let idx = 0;

  while ((m = fence.exec(text)) !== null) {
    const lang    = (m[1] || 'text').toLowerCase();
    const code    = m[2].trim();
    if (!code) continue;

    const ext = EXT_MAP[lang] || 'txt';

    // Try to find filename in the lines above the fence
    const before = text.slice(Math.max(0, m.index - 200), m.index);
    let filename  = null;

    for (const pat of FILENAME_PATTERNS) {
      const hit = before.match(pat);
      if (hit) { filename = hit[1]; break; }
    }

    // Or try the first line of code for a comment with a filename
    const firstLine = code.split('\n')[0];
    if (!filename) {
      for (const pat of FILENAME_PATTERNS) {
        const hit = firstLine.match(pat);
        if (hit) { filename = hit[1]; break; }
      }
    }

    if (!filename) {
      // Generate a sensible filename from the language
      idx++;
      filename = lang === 'json' ? `config_${idx}.json`
               : lang === 'css'  ? `styles_${idx}.css`
               : lang === 'html' ? `index_${idx}.html`
               : lang === 'sql'  ? `schema_${idx}.sql`
               : lang === 'yaml' || lang === 'yml' ? `config_${idx}.yml`
               : lang === 'bash' || lang === 'sh'  ? `script_${idx}.sh`
               : lang === 'md'   ? `README_${idx}.md`
               : `code_${idx}.${ext}`;
    }

    // Deduplicate — if same filename appears twice, suffix it
    let finalName = filename;
    let suffix = 1;
    while (seen.has(finalName)) { finalName = filename.replace(/(\.[^.]+)$/, `_${suffix}$1`); suffix++; }
    seen.add(finalName);

    files.push({ path: finalName, content: code });
  }

  return files;
}

// ══════════════════════════════════════════════════════════
//  Build the project scaffold around extracted files
// ══════════════════════════════════════════════════════════
function buildProjectZip(squadKey, sessionFiles, sessionId) {
  const files = [];
  const ts    = new Date().toISOString();

  // ── README ────────────────────────────────────────────
  files.push({
    path: 'README.md',
    content: `# Velverse AI — Generated Project

**Squad:** ${squadKey.toUpperCase()} | **Session:** \`${sessionId}\`  
**Generated:** ${ts}  
**Platform:** [Velverse AI](https://velverse.ai)

---

## Project Structure

\`\`\`
${sessionFiles.map(f => '├── ' + f.path).join('\n')}
└── README.md
\`\`\`

## Getting Started

\`\`\`bash
# Install dependencies (if package.json is present)
npm install

# Run the project
npm start
# or
node server.js      # Node.js backend
# or open index.html in browser
\`\`\`

## About This Project

This code was generated by the **Velverse AI ${squadKey} squad**.

> Velverse AI deploys five autonomous AI squads — Software Dev, Web Dev, UI/UX,
> Digital Marketing, and Data Analysis — each powered by a dedicated Flowise AI
> prediction endpoint. This project was assembled from the AI session history.

---

*Generated by Velverse AI · SCET CSE Final Year Project 2025–26*
`,
  });

  // ── .gitignore ────────────────────────────────────────
  files.push({
    path: '.gitignore',
    content: `node_modules/
.env
.DS_Store
dist/
build/
*.log
`,
  });

  // ── All session files ─────────────────────────────────
  for (const f of sessionFiles) {
    files.push(f);
  }

  // ── Session log (all AI messages) ────────────────────
  // (added by caller)

  return files;
}

// ══════════════════════════════════════════════════════════
//  POST /api/zip/generate
//  Body: { sessionId, agentType, projectName? }
//  Returns: application/zip stream
// ══════════════════════════════════════════════════════════
const generateZip = async (req, res, next) => {
  try {
    const { sessionId, agentType, projectName } = req.body;

    if (!sessionId && !agentType) {
      return res.status(400).json({ success:false, message:'sessionId or agentType required' });
    }

    // ── Fetch chat history ─────────────────────────────
    const filter = { userId: req.user._id };
    if (sessionId)  filter.sessionId = sessionId;
    if (agentType)  filter.agentType = agentType;

    const history = await ChatHistory.find(filter)
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    if (!history.length) {
      return res.status(404).json({ success:false, message:'No chat history found for this session.' });
    }

    // ── Extract all code blocks from all AI responses ──
    const sessionFiles = [];
    const allCode = history.map(h => h.response).join('\n\n');
    const extracted = extractFiles(allCode);
    sessionFiles.push(...extracted);

    // ── Build conversation log ─────────────────────────
    const logLines = ['# Session Conversation Log', ''];
    for (const h of history) {
      logLines.push(`## User\n${h.message}\n`);
      logLines.push(`## AI Response\n${h.response}\n`);
      logLines.push('---\n');
    }
    sessionFiles.push({ path: 'session_log.md', content: logLines.join('\n') });

    // ── Assemble project scaffold ──────────────────────
    const squad = agentType || history[0]?.agentType || 'squad';
    const sid   = sessionId  || history[0]?.sessionId || 'unknown';
    const allFiles = buildProjectZip(squad, sessionFiles, sid);

    // ── Build ZIP ──────────────────────────────────────
    const zipBuffer = buildZip(allFiles);

    const safeProject = (projectName || `velverse-${squad}-project`)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();

    // ── Stream response ────────────────────────────────
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeProject}.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('X-Files-Count', allFiles.length);
    res.setHeader('X-Code-Files', extracted.length);
    res.end(zipBuffer);

  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════
//  GET /api/zip/preview?sessionId=xxx&agentType=software
//  Returns a JSON preview of what the ZIP will contain
// ══════════════════════════════════════════════════════════
const previewZip = async (req, res, next) => {
  try {
    const { sessionId, agentType } = req.query;
    const filter = { userId: req.user._id };
    if (sessionId) filter.sessionId = sessionId;
    if (agentType) filter.agentType = agentType;

    const history = await ChatHistory.find(filter)
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    if (!history.length) {
      return res.status(404).json({ success:false, message:'No chat history found.' });
    }

    const allCode  = history.map(h => h.response).join('\n\n');
    const extracted = extractFiles(allCode);

    res.json({
      success:       true,
      sessionId:     sessionId || history[0]?.sessionId,
      agentType:     agentType || history[0]?.agentType,
      totalMessages: history.length,
      codeFiles:     extracted.map(f => ({ path: f.path, lines: f.content.split('\n').length })),
      totalFiles:    extracted.length + 3, // + README + .gitignore + session_log
      ready:         extracted.length > 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateZip, previewZip };
