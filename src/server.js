import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(projectRoot, 'data');
const storeFile = path.join(dataDir, 'store.json');
const persistentKeys = [
  'issues',
  'proposals',
  'votes',
  'feedback',
  'ideas',
  'feedbackInstitutional',
  'feedbackExhibition',
  'sessionLogs'
];

const voteTopicKeys = [
  'education',
  'environment',
  'tax',
  'surveillance',
  'housing',
  'immigration',
  'speech',
  'healthcare'
];

const createDefaultStore = () => ({
  issues: [],
  proposals: [],
  votes: [],
  feedback: [],
  discussions: new Map(),
  ideas: [],
  feedbackInstitutional: [],
  feedbackExhibition: [],
  sessionLogs: []
});

let store = createDefaultStore();

const ensureDataDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

const loadStoreFromDisk = async () => {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(storeFile, 'utf-8');
    const parsed = JSON.parse(raw);
    persistentKeys.forEach((key) => {
      if (Array.isArray(store[key])) {
        store[key] = Array.isArray(parsed[key]) ? parsed[key] : [];
      }
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to load persisted store', error);
    }
  }
};

const persistStoreToDisk = async () => {
  const snapshot = { lastUpdated: new Date().toISOString() };
  persistentKeys.forEach((key) => {
    snapshot[key] = store[key];
  });
  await ensureDataDir();
  await fs.writeFile(storeFile, JSON.stringify(snapshot, null, 2), 'utf-8');
};

const persistStoreSafe = async () => {
  try {
    await persistStoreToDisk();
  } catch (error) {
    console.warn('Failed to persist store', error);
  }
};

await loadStoreFromDisk();

const sanitizePreferences = (input) => {
  const preferences = {};
  if (input && typeof input === 'object') {
    voteTopicKeys.forEach((key) => {
      const value = input[key];
      if (typeof value === 'string' && value.trim()) {
        preferences[key] = value.trim();
      }
    });
  }
  return preferences;
};

const sanitizeVotes = (input) => {
  const votes = {};
  voteTopicKeys.forEach((key) => {
    const raw = input && typeof input === 'object' ? input[key] : undefined;
    const value = Number(raw);
    votes[key] = Number.isFinite(value) ? value : 0;
  });
  return votes;
};

const metricKeys = ['ifi', 'ssi', 'mpi', 'totalCost', 'totalPP', 'remainingPP'];
const sanitizeMetrics = (input) => {
  if (!input || typeof input !== 'object') return null;
  const metrics = {};
  metricKeys.forEach((key) => {
    const value = Number(input[key]);
    if (Number.isFinite(value)) {
      metrics[key] = value;
    }
  });
  return Object.keys(metrics).length ? metrics : null;
};

const diffKeys = ['ifi', 'ssi', 'mpi', 'ppSpent'];
const sanitizeDiff = (input) => {
  if (!input || typeof input !== 'object') return null;
  const diff = {};
  diffKeys.forEach((key) => {
    const value = Number(input[key]);
    if (Number.isFinite(value)) {
      diff[key] = value;
    }
  });
  return Object.keys(diff).length ? diff : null;
};

const modifierKeys = ['ifi', 'ssi', 'mpi', 'ppBonus'];
const sanitizeModifiers = (input) => {
  if (!input || typeof input !== 'object') return null;
  const modifiers = {};
  modifierKeys.forEach((key) => {
    const value = Number(input[key]);
    if (Number.isFinite(value)) {
      modifiers[key] = value;
    }
  });
  return Object.keys(modifiers).length ? modifiers : null;
};

const sanitizeEvents = (events) => {
  if (!Array.isArray(events)) return [];
  return events
    .slice(0, 20)
    .map((entry) => {
      const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
      const type = typeof entry?.type === 'string' ? entry.type.trim() : '';
      const effectSummary =
        typeof entry?.effectSummary === 'string' ? entry.effectSummary.trim() : '';
      const id = typeof entry?.id === 'string' && entry.id.trim() ? entry.id.trim() : uuid();
      return {
        id,
        title,
        type,
        effectSummary
      };
    })
    .filter((entry) => entry.title || entry.type || entry.effectSummary);
};

const sanitizeRoundSnapshot = (round) => {
  const votes = sanitizeVotes(round?.votes);
  const metrics = sanitizeMetrics(round?.metrics);
  const modifiers = sanitizeModifiers(round?.modifiers);
  return {
    votes,
    metrics,
    modifiers,
    locked: Boolean(round?.locked)
  };
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
const sendClientFile = (res, fileName) => {
  res.sendFile(path.join(projectRoot, fileName));
};

app.get('/index.html', (_, res) => {
  sendClientFile(res, 'index.html');
});

app.get('/main.js', (_, res) => {
  sendClientFile(res, 'main.js');
});

app.get('/styles.css', (_, res) => {
  sendClientFile(res, 'styles.css');
});

const seedIdeas = [
  {
    topic: 'education',
    title: '課綱透明協作平台',
    description: '建立線上協作平台，公開課綱草案並納入地方教師、學生與家長的審議意見。'
  },
  {
    topic: 'environment',
    title: '漁電共生監測機制',
    description: '由漁民與科研團隊共組監測小組，定期發布海域生態與補償金使用情形。'
  },
  {
    topic: 'tax',
    title: '高收入稅收專款專用',
    description: '新增稅收自動撥入弱勢居住補助基金，每季公開支出明細接受公民審計。'
  },
  {
    topic: 'surveillance',
    title: '監控資料稽核委員會',
    description: '成立跨黨派＋民間稽核委員會，審查每一次監控啟用與資料刪除紀錄。'
  },
  {
    topic: 'housing',
    title: '社宅合作社自主管理',
    description: '社宅住戶可成立合作社管理維護費並參與租金評議，提高透明度與認同感。'
  },
  {
    topic: 'immigration',
    title: '移工融入支持方案',
    description: '設立語言與法律諮詢中心並提供雇主調整補助，促進移工與社區共學共融。'
  },
  {
    topic: 'speech',
    title: '平台自律＋公民評議',
    description: '要求平台公開審查流程並設公民評議小組，提供申訴與救濟機制。'
  },
  {
    topic: 'healthcare',
    title: '健康資料使用揭露',
    description: '所有疫苗護照資料調閱必須即時公告用途與保存期限，由公民資料會審查。'
  }
];

if (!store.ideas.length) {
  seedIdeas.forEach((seed) => {
    store.ideas.push({
      id: uuid(),
      topic: seed.topic,
      title: seed.title,
      description: seed.description,
      support: 0,
      concern: 0,
      createdAt: new Date().toISOString()
    });
  });
  await persistStoreSafe();
}

const findIssue = (issueId) => store.issues.find((issue) => issue.id === issueId);
const findProposal = (proposalId) => store.proposals.find((proposal) => proposal.id === proposalId);

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/issues', (_, res) => {
  res.json(store.issues);
});

app.post('/issues', async (req, res) => {
  const { title, summary, timeline, stakeholders } = req.body;
  if (!title || !summary) {
    res.status(400).json({ error: 'title and summary required' });
    return;
  }
  const issue = {
    id: uuid(),
    title,
    summary,
    timeline: Array.isArray(timeline) ? timeline : [],
    stakeholders: Array.isArray(stakeholders) ? stakeholders : [],
    createdAt: new Date().toISOString()
  };
  store.issues.push(issue);
  io.emit('issueCreated', issue);
  await persistStoreSafe();
  res.status(201).json(issue);
});

app.get('/issues/:issueId/proposals', (req, res) => {
  const { issueId } = req.params;
  res.json(store.proposals.filter((proposal) => proposal.issueId === issueId));
});

app.post('/issues/:issueId/proposals', async (req, res) => {
  const { issueId } = req.params;
  if (!findIssue(issueId)) {
    res.status(404).json({ error: 'issue not found' });
    return;
  }
  const { title, description, author } = req.body;
  if (!title || !description) {
    res.status(400).json({ error: 'title and description required' });
    return;
  }
  const proposal = {
    id: uuid(),
    issueId,
    title,
    description,
    author: author ?? '匿名',
    createdAt: new Date().toISOString()
  };
  store.proposals.push(proposal);
  io.emit('proposalCreated', proposal);
  await persistStoreSafe();
  res.status(201).json(proposal);
});

app.get('/proposals/:proposalId/votes', (req, res) => {
  const { proposalId } = req.params;
  res.json(store.votes.filter((vote) => vote.proposalId === proposalId));
});

app.post('/proposals/:proposalId/votes', async (req, res) => {
  const { proposalId } = req.params;
  const proposal = findProposal(proposalId);
  if (!proposal) {
    res.status(404).json({ error: 'proposal not found' });
    return;
  }
  const { userId, points } = req.body;
  if (!userId || typeof points !== 'number' || points < 0) {
    res.status(400).json({ error: 'invalid vote payload' });
    return;
  }
  const cost = points * points;
  const vote = {
    id: uuid(),
    proposalId,
    userId,
    points,
    cost,
    createdAt: new Date().toISOString()
  };
  store.votes.push(vote);
  io.emit('voteCast', { proposalId, vote });
  await persistStoreSafe();
  res.status(201).json(vote);
});

app.post('/issues/:issueId/feedback', async (req, res) => {
  const { issueId } = req.params;
  if (!findIssue(issueId)) {
    res.status(404).json({ error: 'issue not found' });
    return;
  }
  const { summary, actions, author } = req.body;
  if (!summary) {
    res.status(400).json({ error: 'summary required' });
    return;
  }
  const entry = {
    id: uuid(),
    issueId,
    summary,
    actions: Array.isArray(actions) ? actions : [],
    author: author ?? '匿名',
    createdAt: new Date().toISOString()
  };
  store.feedback.push(entry);
  io.emit('feedbackCreated', entry);
  await persistStoreSafe();
  res.status(201).json(entry);
});

app.get('/issues/:issueId/feedback', (req, res) => {
  const { issueId } = req.params;
  res.json(store.feedback.filter((item) => item.issueId === issueId));
});

app.get('/ideas', (_, res) => {
  res.json(store.ideas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/ideas', async (req, res) => {
  const { topic, title, description } = req.body;
  if (!topic || !title) {
    res.status(400).json({ error: 'topic and title required' });
    return;
  }
  const idea = {
    id: uuid(),
    topic,
    title,
    description: description ?? '',
    support: 0,
    concern: 0,
    createdAt: new Date().toISOString()
  };
  store.ideas.unshift(idea);
  io.emit('ideaCreated', idea);
  await persistStoreSafe();
  res.status(201).json(idea);
});

app.post('/ideas/:ideaId/react', async (req, res) => {
  const { ideaId } = req.params;
  const { type } = req.body;
  const idea = store.ideas.find((item) => item.id === ideaId);
  if (!idea) {
    res.status(404).json({ error: 'idea not found' });
    return;
  }
  if (type !== 'support' && type !== 'concern') {
    res.status(400).json({ error: 'invalid reaction type' });
    return;
  }
  idea[type] += 1;
  io.emit('ideaUpdated', idea);
  await persistStoreSafe();
  res.json(idea);
});

app.delete('/ideas/:ideaId', async (req, res) => {
  const { ideaId } = req.params;
  const index = store.ideas.findIndex((idea) => idea.id === ideaId);
  if (index === -1) {
    res.status(404).json({ error: 'idea not found' });
    return;
  }
  const [removed] = store.ideas.splice(index, 1);
  io.emit('ideaDeleted', { id: removed.id });
  await persistStoreSafe();
  res.status(204).end();
});

const votesHaveActivity = (votes) => voteTopicKeys.some((key) => (votes?.[key] ?? 0) !== 0);

app.get('/sessions', (_, res) => {
  res.json(store.sessionLogs);
});

app.post('/sessions', async (req, res) => {
  const { preferences, baseline, postEvent, diff, events } = req.body ?? {};
  const normalizedPreferences = sanitizePreferences(preferences);
  const normalizedBaseline = sanitizeRoundSnapshot(baseline);
  const normalizedPost = sanitizeRoundSnapshot(postEvent);
  const normalizedEvents = sanitizeEvents(events);

  const diffData = sanitizeDiff(diff) ?? {};
  const ensureDiffValue = (key, fallback) => {
    if (Number.isFinite(diffData[key])) return;
    if (Number.isFinite(fallback)) {
      diffData[key] = fallback;
    }
  };

  if (normalizedBaseline.metrics && normalizedPost.metrics) {
    ensureDiffValue(
      'ifi',
      normalizedPost.metrics.ifi - normalizedBaseline.metrics.ifi
    );
    ensureDiffValue(
      'ssi',
      normalizedPost.metrics.ssi - normalizedBaseline.metrics.ssi
    );
    ensureDiffValue(
      'mpi',
      normalizedPost.metrics.mpi - normalizedBaseline.metrics.mpi
    );
    ensureDiffValue(
      'ppSpent',
      normalizedPost.metrics.totalCost - normalizedBaseline.metrics.totalCost
    );
  }

  Object.keys(diffData).forEach((key) => {
    if (!Number.isFinite(diffData[key])) {
      delete diffData[key];
    }
  });

  const hasPreferences = Object.keys(normalizedPreferences).length > 0;
  const baselineActive = votesHaveActivity(normalizedBaseline.votes);
  const postActive = votesHaveActivity(normalizedPost.votes);
  const hasEvents = normalizedEvents.length > 0;
  const hasLocks = normalizedBaseline.locked || normalizedPost.locked;

  if (!hasPreferences && !baselineActive && !postActive && !hasEvents && !hasLocks) {
    res.status(204).end();
    return;
  }

  const snapshot = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    preferences: normalizedPreferences,
    baseline: normalizedBaseline,
    postEvent: normalizedPost,
    diff: Object.keys(diffData).length ? diffData : null,
    events: normalizedEvents
  };

  store.sessionLogs.unshift(snapshot);
  if (store.sessionLogs.length > 500) {
    store.sessionLogs.length = 500;
  }
  await persistStoreSafe();
  res.status(201).json(snapshot);
});

app.get('/feedback/institutional', (_, res) => {
  res.json(store.feedbackInstitutional);
});

app.post('/feedback/institutional', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'message required' });
    return;
  }
  const entry = {
    id: uuid(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  store.feedbackInstitutional.unshift(entry);
  io.emit('institutionFeedbackCreated', entry);
  await persistStoreSafe();
  res.status(201).json(entry);
});

app.get('/feedback/exhibition', (_, res) => {
  res.json(store.feedbackExhibition);
});

app.post('/feedback/exhibition', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'message required' });
    return;
  }
  const entry = {
    id: uuid(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  store.feedbackExhibition.unshift(entry);
  io.emit('exhibitionFeedbackCreated', entry);
  await persistStoreSafe();
  res.status(201).json(entry);
});

app.delete('/issues/:issueId/discussion', (req, res) => {
  const { issueId } = req.params;
  if (!findIssue(issueId)) {
    res.status(404).json({ error: 'issue not found' });
    return;
  }
  store.discussions.delete(issueId);
  io.to(issueId).emit('discussionCleared');
  res.status(204).end();
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
    next();
    return;
  }
  res.sendFile(path.join(projectRoot, 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('joinDiscussion', ({ issueId, user }) => {
    socket.join(issueId);
    const current = store.discussions.get(issueId) ?? [];
    socket.emit('discussionHistory', current);
    socket.data.user = user ?? '匿名';
    socket.data.issueId = issueId;
  });

  socket.on('discussionMessage', (payload) => {
    const issueId = socket.data.issueId;
    if (!issueId) return;
    const message = {
      id: uuid(),
      issueId,
      author: socket.data.user ?? '匿名',
      text: payload?.text ?? '',
      createdAt: new Date().toISOString()
    };
    const history = store.discussions.get(issueId) ?? [];
    history.push(message);
    store.discussions.set(issueId, history);
    io.to(issueId).emit('discussionMessage', message);
  });
});

const port = process.env.PORT ?? 4000;
httpServer.listen(port, () => {
  console.log(`API listening on ${port}`);
});
