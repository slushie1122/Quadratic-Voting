const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const hero = $('#hero');
const experience = $('#experience');
const stages = $$('.stage');
const timelineItems = $$('.timeline__item');
const MIN_REQUIRED_INTRO_SELECTIONS = 3;
const BASE_PP = 12;
const defaultEventSummary = '尚未抽事件卡。請先鎖定第一輪結果。';
const messageTimeouts = {
  baseline: null,
  postEvent: null
};
const introIssueKeys = ['education', 'environment', 'tax', 'surveillance', 'housing', 'immigration', 'speech', 'healthcare'];
const introChoiceLabels = {
  education: {
    diverse: '維持地方自主',
    standard: '推動統一標準'
  },
  environment: {
    green: '優先推進風電',
    fisher: '保障漁權與補償'
  },
  tax: {
    redistribute: '加稅並專款救助',
    incentive: '維持誘因競爭力'
  },
  surveillance: {
    security: '優先公共安全',
    privacy: '守護資料隱私'
  },
  housing: {
    regulate: '嚴格限制短租',
    liberalize: '尊重市場自由'
  },
  immigration: {
    open: '提高居留配額',
    limit: '維持現有限制'
  },
  speech: {
    regulate: '平台須負法律責任',
    free: '捍衛言論自由'
  },
  healthcare: {
    passport: '實施疫苗護照',
    voluntary: '維持自願接種'
  }
};
const voteTopics = [
  {
    key: 'education',
    title: '課綱一致化改革',
    subtitle: '統一教材 vs 多元聲音',
    description:
      '政府推動課綱一致化以提升競爭力，但遭批評壓抑多元文化與在地語言。',
    color: 'linear-gradient(120deg, rgba(56, 189, 248, 0.9), rgba(129, 140, 248, 0.75))'
  },
  {
    key: 'environment',
    title: '海岸風電擴張案',
    subtitle: '低碳與漁權衝突',
    description:
      '大規模離岸風電將占用傳統漁場，支持者主張轉型，反對者憂心生計與生態。',
    color: 'linear-gradient(120deg, rgba(45, 212, 191, 0.9), rgba(74, 222, 128, 0.75))'
  },
  {
    key: 'tax',
    title: '高收入者追加稅',
    subtitle: '再分配或人才出走',
    description:
      '提案大幅提高高收入族群稅率，支持者稱公平，反方擔心人才與資金外流。',
    color: 'linear-gradient(120deg, rgba(251, 191, 36, 0.9), rgba(244, 114, 182, 0.75))'
  },
  {
    key: 'surveillance',
    title: '城市 AI 監控網',
    subtitle: '公共安全與隱私界線',
    description:
      '智慧路燈與人臉辨識系統可即時偵測犯罪，也讓政府監控公民更為容易。',
    color: 'linear-gradient(120deg, rgba(129, 140, 248, 0.85), rgba(59, 130, 246, 0.7))'
  },
  {
    key: 'housing',
    title: '住宅限購與租金上限',
    subtitle: '守護居住 vs 市場失靈',
    description:
      '限制多屋族持有並凍漲租金，青年大力支持，房東警告供給將大幅縮水。',
    color: 'linear-gradient(120deg, rgba(248, 113, 113, 0.85), rgba(251, 191, 36, 0.7))'
  },
  {
    key: 'immigration',
    title: '移工長期居留配額',
    subtitle: '產業需求與社會承擔',
    description:
      '政府計畫提高移工長期居留配額以穩定勞動力，社會則擔心公共資源負荷與融合問題。',
    color: 'linear-gradient(120deg, rgba(74, 222, 128, 0.85), rgba(45, 212, 191, 0.7))'
  },
  {
    key: 'speech',
    title: '數位言論平台責任',
    subtitle: '假訊息與言論自由',
    description:
      '為了壓制假訊息，政府要求平台快速下架爭議內容，支持者盼降低誤導，反方憂心政治審查。',
    color: 'linear-gradient(120deg, rgba(196, 181, 253, 0.85), rgba(129, 140, 248, 0.7))'
  },
  {
    key: 'healthcare',
    title: '健康資料共享政策',
    subtitle: '公共安全與個人隱私',
    description:
      '政府擬建立疫苗護照與健康資料交換平台，支持者認為有助防疫，反方擔心個資與差別待遇。',
    color: 'linear-gradient(120deg, rgba(190, 242, 100, 0.85), rgba(74, 222, 128, 0.7))'
  }
];
const roundSuffix = {
  baseline: 'baseline',
  postEvent: 'post'
};
const createEmptyVotes = () => {
  const votes = {};
  voteTopics.forEach((topic) => {
    votes[topic.key] = 0;
  });
  return votes;
};
const eventsData = [
  {
    id: 'gov-reform',
    title: '政府改革法案',
    type: '政治事件',
    description: '政府推行擴張型財政政策以增加公共支出，卻引發稅負不均與特權質疑。',
    effectSummary: 'IFI -6、MPI -4、SSI -2、PP -1',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) - 6;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 4;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 2;
      draft.eventModifiers.ppBonus = (draft.eventModifiers.ppBonus ?? 0) - 1;
    },
    summaryText: '政府改革提高稅負壓力並激化不公平感，政治點數略為收縮。'
  },
  {
    id: 'citizen-protest',
    title: '群眾抗議行動',
    type: '社會事件',
    description: '市民不滿制度不公走上街頭要求透明改革，壓力迫使政府回應。',
    effectSummary: 'MPI +8、IFI +4、PP +2',
    impact: (draft) => {
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) + 8;
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) + 4;
      draft.eventModifiers.ppBonus = (draft.eventModifiers.ppBonus ?? 0) + 2;
    },
    summaryText: '群眾抗議帶來改革動能，弱勢參與與制度公平同步提升。'
  },
  {
    id: 'media-bias',
    title: '媒體偏向報導',
    type: '媒體事件',
    description: '特定媒體片面聚焦單一議題，輿論失衡使政策討論遭到扭曲。',
    effectSummary: '指定議題被放大，IFI -5、SSI -6',
    impact: (draft) => {
      const spotlightTopic = voteTopics[Math.floor(Math.random() * voteTopics.length)].key;
      draft.mediaSpotlight = spotlightTopic;
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) - 5;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 6;
      if (draft.votes && typeof draft.votes[spotlightTopic] === 'number') {
        draft.votes[spotlightTopic] += draft.votes[spotlightTopic] >= 0 ? 1 : -1;
      }
    },
    summaryText: '媒體偏向讓某議題熱度暴衝，公平與穩定雙雙受損。'
  },
  {
    id: 'bureaucracy',
    title: '官僚延宕',
    type: '制度事件',
    description: '繁複的行政流程拖延政策推進，社會信任與參與熱度急遽下降。',
    effectSummary: 'SSI -9、MPI -5',
    impact: (draft) => {
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 9;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 5;
    },
    summaryText: '官僚拖延削弱行動力，穩定與參與指數明顯下滑。'
  },
  {
    id: 'elite-meeting',
    title: '精英協商會議',
    type: '政治事件',
    description: '少數權力精英密室協商改變規則，大眾被排除在決策之外。',
    effectSummary: 'IFI -8、MPI -6、PP -1',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) - 8;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 6;
      draft.eventModifiers.ppBonus = (draft.eventModifiers.ppBonus ?? 0) - 1;
      if (draft.votes) {
        draft.votes.surveillance = (draft.votes.surveillance ?? 0) + 1;
      }
    },
    summaryText: '精英協商讓公平與參與雙雙倒退，公共資源更為集中。'
  },
  {
    id: 'global-crisis',
    title: '全球危機',
    type: '外部事件',
    description: '國際經濟衝擊帶來資源緊縮，既定議題版圖被迫重新洗牌。',
    effectSummary: 'SSI -7、IFI -4，全體票數重置',
    impact: (draft) => {
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 7;
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) - 4;
      draft.votes = createEmptyVotes();
    },
    summaryText: '全球危機打亂了原本的政治佈局，你必須重新分配所有 PP。'
  },
  {
    id: 'trust-rebuild',
    title: '制度信任重建',
    type: '正向事件',
    description: '政府主動公開資料並與公民共制監督機制，社會重拾信任。',
    effectSummary: 'IFI +6、SSI +5、MPI +5、PP +2',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) + 6;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) + 5;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) + 5;
      draft.eventModifiers.ppBonus = (draft.eventModifiers.ppBonus ?? 0) + 2;
    },
    summaryText: '信任重建計畫讓制度重新獲得支持，也釋出額外的政治點數。'
  },
  {
    id: 'tech-surveillance',
    title: '全面科技監控上線',
    type: '科技事件',
    description: '政府啟動城市 AI 監控系統，治安提升但公民對隱私的疑慮爆發。',
    effectSummary: 'SSI +3、MPI -8',
    impact: (draft) => {
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) + 3;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 8;
      if (draft.votes) {
        draft.votes.surveillance = (draft.votes.surveillance ?? 0) + 2;
      }
    },
    summaryText: '科技監控提高治安效率，卻重創弱勢參與與公共信任。'
  },
  {
    id: 'housing-conflict',
    title: '公共住房衝突',
    type: '社區事件',
    description: '社區為公共住房資源爭執不休，政策被指偏袒特定族群。',
    effectSummary: 'IFI +3、SSI -4、MPI -2',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) + 3;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 4;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 2;
    },
    summaryText: '住房衝突讓平等議題升溫，但社區穩定與參與度略降。'
  },
  {
    id: 'labor-strike',
    title: '全國罷工浪潮',
    type: '勞動事件',
    description: '勞工團體要求提高基本工資與縮短工時，產業運作出現停滯。',
    effectSummary: 'SSI -7、MPI +6、IFI +2',
    impact: (draft) => {
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 7;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) + 6;
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) + 2;
    },
    summaryText: '罷工提高弱勢發聲力道，也帶來短期的不穩定。'
  },
  {
    id: 'culture-clash',
    title: '族群文化衝突',
    type: '社會事件',
    description: '多元文化節引發保守勢力強烈反彈，社群出現撕裂與對立。',
    effectSummary: 'IFI -5、SSI -8、MPI -7',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) - 5;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) - 8;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) - 7;
    },
    summaryText: '文化衝突加劇社會不信任，三項指數全面下跌。'
  },
  {
    id: 'citizen-assembly',
    title: '公民審議會突破',
    type: '正向事件',
    description: '隨機抽樣的公民審議會提出具體改革建議，政府承諾採納並實驗。',
    effectSummary: 'IFI +7、SSI +6、MPI +9、PP +3',
    impact: (draft) => {
      draft.eventModifiers.ifi = (draft.eventModifiers.ifi ?? 0) + 7;
      draft.eventModifiers.ssi = (draft.eventModifiers.ssi ?? 0) + 6;
      draft.eventModifiers.mpi = (draft.eventModifiers.mpi ?? 0) + 9;
      draft.eventModifiers.ppBonus = (draft.eventModifiers.ppBonus ?? 0) + 3;
    },
    summaryText: '公民審議會為制度注入新活力，三項指數與可用 PP 大幅提升。'
  }
];
const createInitialState = () => {
  const baseVotes = createEmptyVotes();
  return {
    preferences: introIssueKeys.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {}),
    roundVotes: {
      baseline: { ...baseVotes },
      postEvent: { ...baseVotes }
    },
    postEventSeed: { ...baseVotes },
    roundMetrics: {
      baseline: null,
      postEvent: null
    },
    roundCosts: {
      baseline: 0,
      postEvent: 0
    },
    currentRound: 'baseline',
    ppBase: BASE_PP,
    eventModifiers: {
      ifi: 0,
      ssi: 0,
      mpi: 0,
      ppBonus: 0
    },
    eventCard: null,
    eventDrawn: false,
    mediaSpotlight: null,
    deck: [],
    eventHistory: [],
    lockedRounds: {
      baseline: false,
      postEvent: false
    },
    ideas: [],
    sessionLogs: [],
    feedback: {
      institutional: [],
      exhibition: []
    },
    ideaReactions: {}
  };
};
const ADMIN_PASSWORD = 'admin';
const storageKeys = {
  baselineVotes: 'trap-baseline-votes',
  postVotes: 'trap-post-votes',
  ideaReactions: 'trap-idea-reactions'
};
const loadFromStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn('Failed to parse storage', key, error);
    return fallback;
  }
};
const persistToStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to persist storage', key, error);
  }
};
const createState = () => {
  const initial = createInitialState();
  const storedBaseline = loadFromStorage(storageKeys.baselineVotes, null);
  const storedPost = loadFromStorage(storageKeys.postVotes, null);
  if (storedBaseline && typeof storedBaseline === 'object') {
    initial.roundVotes.baseline = { ...initial.roundVotes.baseline, ...storedBaseline };
  }
  if (storedPost && typeof storedPost === 'object') {
    initial.roundVotes.postEvent = { ...initial.roundVotes.postEvent, ...storedPost };
    initial.postEventSeed = { ...initial.roundVotes.postEvent };
  }
  try {
    window.localStorage.removeItem('trap-ideas');
    window.localStorage.removeItem('trap-feedback-institutional');
    window.localStorage.removeItem('trap-feedback-exhibition');
  } catch (error) {
    /* ignore */
  }
  const storedReactions = loadFromStorage(storageKeys.ideaReactions, null);
  if (storedReactions && typeof storedReactions === 'object') {
    const normalized = {};
    Object.entries(storedReactions).forEach(([key, value]) => {
      const ensureEntry = (ideaId) => {
        if (!normalized[ideaId]) {
          normalized[ideaId] = { support: false, concern: false };
        }
        return normalized[ideaId];
      };
      if (key.includes(':')) {
        const [ideaId, action] = key.split(':');
        if (ideaId && (action === 'support' || action === 'concern')) {
          const entry = ensureEntry(ideaId);
          entry[action] = true;
        }
        return;
      }
      if (value && typeof value === 'object') {
        const entry = ensureEntry(key);
        entry.support = Boolean(value.support);
        entry.concern = Boolean(value.concern);
      } else if (value === 'support' || value === 'concern') {
        const entry = ensureEntry(key);
        entry[value] = true;
      } else if (typeof value === 'string' && value.includes(':')) {
        const [, action] = value.split(':');
        if (action === 'support' || action === 'concern') {
          const entry = ensureEntry(key);
          entry[action] = true;
        }
      }
    });
    initial.ideaReactions = normalized;
  }
  return initial;
};
const state = createState();
const persistState = () => {
  persistToStorage(storageKeys.baselineVotes, state.roundVotes.baseline);
  persistToStorage(storageKeys.postVotes, state.roundVotes.postEvent);
  persistToStorage(storageKeys.ideaReactions, state.ideaReactions);
};
const API_BASE =
  window.location.protocol === 'file:' || window.location.origin === 'null'
    ? 'http://localhost:4000'
    : window.location.origin;
const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    ...options
  });
  if (!response.ok) {
    let message = '伺服器發生錯誤';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch (error) {
      /* ignore */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const timeline = {
  current: 0,
  goTo(index) {
    const clampedIndex = clamp(index, 0, stages.length - 1);
    stages.forEach((section, idx) => {
      const isActive = idx === clampedIndex;
      section.hidden = !isActive;
      section.classList.toggle('is-active', isActive);
    });
    timelineItems.forEach((item, idx) => {
      item.classList.toggle('timeline__item--active', idx === clampedIndex);
    });
    this.current = clampedIndex;
    if (clampedIndex === 1) {
      state.currentRound = 'baseline';
      updateRoundStatus('baseline');
      syncRoundControls();
    }
    if (clampedIndex === 2) {
      state.currentRound = 'postEvent';
      updateRoundStatus('postEvent');
      syncRoundControls();
      if (state.lockedRounds.baseline && !state.eventDrawn) {
        drawEvent();
      }
    }
    if (clampedIndex === 4) {
      renderOutcome();
      renderFeedbackList('institutional');
      renderFeedbackList('exhibition');
    }
  }
};
const getRoundVotes = (round) => state.roundVotes[round];
const getTotalPoints = (round) =>
  Math.max(0, state.ppBase + (round === 'postEvent' ? state.eventModifiers.ppBonus : 0));
const getTotalCost = (round) => {
  const votes = getRoundVotes(round);
  return voteTopics.reduce((sum, topic) => {
    const val = votes[topic.key];
    return sum + val * val;
  }, 0);
};
const getTotalCostWithProposed = (round, topicKey, newValue) => {
  const votes = getRoundVotes(round);
  return voteTopics.reduce((sum, topic) => {
    const value = topic.key === topicKey ? newValue : votes[topic.key];
    return sum + value * value;
  }, 0);
};
const getRemainingPoints = (round) =>
  getTotalPoints(round) - getTotalCost(round);
const renderVoteBoard = (containerId, round) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  voteTopics.forEach((topic) => {
    const card = document.createElement('article');
    card.className = 'vote-card';
    card.dataset.topic = topic.key;
    card.dataset.round = round;
    card.innerHTML = `
      <div class="vote-card__header">
        <h3>${topic.title}</h3>
        <p>${topic.subtitle}</p>
      </div>
      <div class="vote-controls">
        <button class="vote-btn" data-direction="-1" aria-label="對 ${topic.title} 投負票">−</button>
        <output class="vote-count" id="vote-count-${round}-${topic.key}">0</output>
        <button class="vote-btn" data-direction="1" aria-label="對 ${topic.title} 投正票">＋</button>
      </div>
      <div class="vote-bar-grid" id="vote-bar-${round}-${topic.key}"></div>
      <p class="vote-cost" id="vote-cost-${round}-${topic.key}">花費 PP：0</p>
      <p class="vote-note">${topic.description}</p>
    `;
    container.appendChild(card);
  });
};
const renderVoteBoards = () => {
  renderVoteBoard('vote-columns-baseline', 'baseline');
  renderVoteBoard('vote-columns-post', 'postEvent');
  updateVoteBoard('baseline');
  updateVoteBoard('postEvent');
};
const updateVoteCard = (round, topicKey, maxMagnitude) => {
  const votes = getRoundVotes(round);
  const value = votes[topicKey];
  const countEl = document.getElementById(`vote-count-${round}-${topicKey}`);
  const barEl = document.getElementById(`vote-bar-${round}-${topicKey}`);
  const costEl = document.getElementById(`vote-cost-${round}-${topicKey}`);
  if (!countEl || !barEl || !costEl) return;
  countEl.textContent = value;
  barEl.innerHTML = '';
  const magnitude = Math.abs(value);
  if (magnitude === 0) {
    const cell = document.createElement('div');
    cell.className = 'vote-bar__cell';
    barEl.appendChild(cell);
  } else {
    const cellClass = value > 0 ? 'vote-bar__cell is-positive' : 'vote-bar__cell is-negative';
    const maxCells = Math.min(magnitude, 24);
    for (let i = 0; i < maxCells; i += 1) {
      const cell = document.createElement('div');
      cell.className = cellClass;
      barEl.appendChild(cell);
    }
    if (magnitude > maxCells) {
      const more = document.createElement('div');
      more.className = `${cellClass} overflow`;
      barEl.appendChild(more);
    }
  }
  costEl.textContent = `花費 PP：${value * value}`;
};
const updateVoteBoard = (round) => {
  const votes = getRoundVotes(round);
  const maxMagnitude = Math.max(
    1,
    ...voteTopics.map((topic) => Math.abs(votes[topic.key]))
  );
  voteTopics.forEach((topic) => {
    updateVoteCard(round, topic.key, maxMagnitude);
  });
};
const getRoundModifiers = (round) =>
  round === 'postEvent'
    ? state.eventModifiers
    : { ifi: 0, ssi: 0, mpi: 0, ppBonus: 0 };
const calculateRoundMetrics = (round) => {
  const votes = getRoundVotes(round);
  const modifiers = getRoundModifiers(round);
  let totalCost = 0;
  let negativeCost = 0;
  let positiveCost = 0;
  let polarization = 0;
  let supportSum = 0;
  let opposeSum = 0;
  voteTopics.forEach((topic) => {
    const value = votes[topic.key];
    const cost = value * value;
    totalCost += cost;
    polarization += Math.abs(value);
    if (value >= 0) {
      positiveCost += cost;
      supportSum += value;
    } else {
      negativeCost += cost;
      opposeSum += Math.abs(value);
    }
  });
  const concentration =
    totalCost === 0
      ? 0
      : Math.max(
        ...voteTopics.map((topic) => {
          const value = votes[topic.key];
          return value * value;
        })
      ) / totalCost;
  const fairnessPenalty = concentration * 28;
  const oppositionPenalty = negativeCost * 0.9;
  const baseIFI =
    72 - fairnessPenalty - oppositionPenalty + supportSum * 1.5 - opposeSum * 1.2;
  const shareNegative = totalCost === 0 ? 0 : negativeCost / totalCost;
  const env = votes.environment ?? 0;
  const housing = votes.housing ?? 0;
  const education = votes.education ?? 0;
  const tax = votes.tax ?? 0;
  const surveillance = votes.surveillance ?? 0;
  const immigration = votes.immigration ?? 0;
  const speech = votes.speech ?? 0;
  const healthcare = votes.healthcare ?? 0;
  const supportive =
    Math.max(env, 0) * 4 +
    Math.max(housing, 0) * 4 +
    Math.max(education, 0) * 2 +
    Math.max(immigration, 0) * 3 +
    Math.max(healthcare, 0) * 3;
  const guardian =
    Math.max(-surveillance, 0) * 5 +
    Math.max(-speech, 0) * 4 +
    Math.max(-tax, 0) * 2 +
    Math.max(-immigration, 0) * 2;
  const barrier =
    Math.max(surveillance, 0) * 4 +
    Math.max(speech, 0) * 3 +
    Math.max(-env, 0) * 3 +
    Math.max(-housing, 0) * 2 +
    Math.max(-immigration, 0) * 3 +
    Math.max(-healthcare, 0) * 2;
  const contestedPenalty = (Math.abs(immigration) + Math.abs(speech) + Math.abs(healthcare)) * 1.05;
  const baseSSI =
    70 - polarization * 2.2 - shareNegative * 22 - contestedPenalty + positiveCost * 0.05;
  const civicVoice =
    Math.max(immigration, 0) + Math.max(education, 0) + Math.max(-speech, 0) + Math.max(healthcare, 0) * 0.8;
  const baseMPI = 55 + supportive * 3 + guardian * 2 - barrier * 3 + civicVoice * 1.5;
  const ifi = clamp(baseIFI + modifiers.ifi, 0, 100);
  const ssi = clamp(baseSSI + modifiers.ssi, 0, 100);
  const mpi = clamp(baseMPI + modifiers.mpi, 0, 100);
  const totalPP = getTotalPoints(round);
  const remainingPP = totalPP - totalCost;
  return {
    ifi,
    ssi,
    mpi,
    totalCost,
    totalPP,
    remainingPP
  };
};
const updateRoundStatus = (round) => {
  const metrics = calculateRoundMetrics(round);
  state.roundMetrics[round] = metrics;
  state.roundCosts[round] = metrics.totalCost;
  const suffix = roundSuffix[round];
  const remainingEl = document.getElementById(`pp-remaining-${suffix}`);
  if (remainingEl) {
    remainingEl.textContent = Math.max(0, Math.round(metrics.remainingPP));
  }
  const totalEl = document.getElementById(`pp-total-${suffix}`);
  if (totalEl) {
    totalEl.textContent = Math.round(metrics.totalPP);
  }
  const metricMap = {
    ifi: metrics.ifi,
    ssi: metrics.ssi,
    mpi: metrics.mpi
  };
  Object.entries(metricMap).forEach(([key, value]) => {
    const valueEl = document.getElementById(`metric-${key}-${suffix}-value`);
    if (valueEl) {
      valueEl.textContent = Math.round(value);
    }
    const barEl = document.getElementById(`metric-${key}-${suffix}`);
    if (barEl) {
      barEl.style.width = `${Math.round(value)}%`;
    }
  });
  syncRoundControls();
};
const displayRoundMessage = (round, message, timeout = 3200) => {
  const id = round === 'baseline' ? 'baseline-feedback' : 'post-feedback';
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  if (messageTimeouts[round]) {
    clearTimeout(messageTimeouts[round]);
  }
  if (timeout > 0) {
    messageTimeouts[round] = setTimeout(() => {
      if (el.textContent === message) {
        el.textContent = '';
      }
    }, timeout);
  }
};
const clearRoundMessage = (round) => {
  const id = round === 'baseline' ? 'baseline-feedback' : 'post-feedback';
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  if (messageTimeouts[round]) {
    clearTimeout(messageTimeouts[round]);
    messageTimeouts[round] = null;
  }
};
const syncRoundControls = () => {
  const baselineLock = $('#lock-baseline');
  if (baselineLock) {
    const metrics = state.roundMetrics.baseline;
    const eligibleCost = metrics ? metrics.totalCost > 0 : false;
    baselineLock.disabled = state.lockedRounds.baseline || !eligibleCost;
  }
  const baselineReset = document.querySelector(
    '[data-action="reset-round"][data-round="baseline"]'
  );
  if (baselineReset) {
    baselineReset.disabled = state.lockedRounds.baseline;
  }
  const drawButton = $('#draw-event');
  if (drawButton) {
    drawButton.disabled = !state.lockedRounds.baseline || state.eventDrawn;
    drawButton.textContent = state.eventDrawn ? '事件已揭示' : '抽出事件卡';
  }
  const postReset = document.querySelector(
    '[data-action="reset-round"][data-round="postEvent"]'
  );
  if (postReset) {
    postReset.disabled = !state.eventDrawn || state.lockedRounds.postEvent;
  }
  const postLock = $('#lock-post');
  if (postLock) {
    postLock.disabled = !state.eventDrawn || state.lockedRounds.postEvent;
  }
};
const adjustVote = (round, topicKey, direction) => {
  if (state.currentRound !== round || state.lockedRounds[round]) {
    return;
  }
  const votes = getRoundVotes(round);
  const current = votes[topicKey] ?? 0;
  const proposed = current + direction;
  const projectedCost = getTotalCostWithProposed(round, topicKey, proposed);
  const totalPoints = getTotalPoints(round);
  if (projectedCost > totalPoints) {
    displayRoundMessage(round, '政治點數不足，請調整其他議題的投入。');
    return;
  }
  votes[topicKey] = proposed;
  updateVoteBoard(round);
  updateRoundStatus(round);
  clearRoundMessage(round);
  persistState();
  updateAdminDashboard();
};
const resetRound = (round) => {
  if (state.lockedRounds[round]) return;
  if (round === 'baseline') {
    state.roundVotes.baseline = createEmptyVotes();
  } else {
    state.roundVotes.postEvent = state.postEventSeed
      ? { ...state.postEventSeed }
      : createEmptyVotes();
  }
  updateVoteBoard(round);
  updateRoundStatus(round);
  clearRoundMessage(round);
  persistState();
  updateAdminDashboard();
};
const lockRound = (round) => {
  if (state.lockedRounds[round]) return;
  if (round === 'baseline') {
    const metrics = calculateRoundMetrics('baseline');
    if (metrics.totalCost <= 0) {
      displayRoundMessage('baseline', '至少投入一些 PP 後再鎖定第一輪結果。', 3200);
      return;
    }
    state.roundMetrics.baseline = metrics;
    state.lockedRounds.baseline = true;
    state.postEventSeed = { ...state.roundVotes.baseline };
    state.roundVotes.postEvent = { ...state.postEventSeed };
    updateVoteBoard('postEvent');
    updateRoundStatus('baseline');
    updateRoundStatus('postEvent');
    syncRoundControls();
    persistState();
    updateAdminDashboard();
    timeline.goTo(2);
    return;
  }
  if (!state.eventDrawn) {
    displayRoundMessage('postEvent', '請先抽出事件卡再鎖定比較結果。', 3200);
    return;
  }
  const metrics = calculateRoundMetrics('postEvent');
  state.roundMetrics.postEvent = metrics;
  state.lockedRounds.postEvent = true;
  updateRoundStatus('postEvent');
  clearRoundMessage('postEvent');
  syncRoundControls();
  persistState();
  updateAdminDashboard();
  timeline.goTo(3);
};
const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const initDeck = () => {
  state.deck = shuffleArray(eventsData);
};
const applyEventImpact = (event) => {
  const draft = {
    eventModifiers: { ...state.eventModifiers },
    mediaSpotlight: state.mediaSpotlight,
    votes: { ...state.roundVotes.postEvent }
  };
  event.impact(draft);
  state.eventModifiers = {
    ifi: draft.eventModifiers.ifi ?? state.eventModifiers.ifi ?? 0,
    ssi: draft.eventModifiers.ssi ?? state.eventModifiers.ssi ?? 0,
    mpi: draft.eventModifiers.mpi ?? state.eventModifiers.mpi ?? 0,
    ppBonus: draft.eventModifiers.ppBonus ?? state.eventModifiers.ppBonus ?? 0
  };
  state.mediaSpotlight = draft.mediaSpotlight ?? null;
  if (draft.votes) {
    state.roundVotes.postEvent = { ...draft.votes };
  }
};
const updateEventHistory = (event) => {
  state.eventHistory.unshift({
    id: event.id,
    title: event.title,
    type: event.type,
    effectSummary: event.effectSummary
  });
  if (state.eventHistory.length > 10) {
    state.eventHistory.length = 10;
  }
  const historyList = $('#event-history');
  if (!historyList) return;
  historyList.innerHTML = '';
  state.eventHistory.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.title}</strong><span>${entry.type}</span><p class="vote-note">${entry.effectSummary}</p>`;
    historyList.appendChild(li);
  });
  updateAdminDashboard();
};
const showEventModal = (event) => {
  $('#modal-type').textContent = event.type;
  $('#modal-title').textContent = event.title;
  $('#modal-description').textContent = event.description;
  $('#modal-effect').textContent = event.effectSummary;
  const modal = $('#event-modal');
  if (modal) modal.hidden = false;
};
const hideEventModal = () => {
  const modal = $('#event-modal');
  if (modal) modal.hidden = true;
};
const drawEvent = () => {
  if (!state.lockedRounds.baseline || state.eventDrawn) return;
  if (!state.deck.length) {
    initDeck();
  }
  const event = state.deck.shift();
  state.eventCard = event;
  state.eventDrawn = true;
  applyEventImpact(event);
  state.postEventSeed = { ...state.roundVotes.postEvent };
  updateEventHistory(event);
  const summary = $('#event-summary');
  if (summary) {
    summary.textContent = event.summaryText;
  }
  const drawButton = $('#draw-event');
  if (drawButton) {
    drawButton.disabled = true;
    drawButton.textContent = '事件已揭示';
  }
  const postBoard = $('#post-vote-board');
  if (postBoard) {
    postBoard.hidden = false;
  }
  clearRoundMessage('postEvent');
  displayRoundMessage('postEvent', '事件已生效，請重新配置你的 PP 再鎖定結果。', 0);
  updateVoteBoard('postEvent');
  updateRoundStatus('postEvent');
  syncRoundControls();
  persistState();
  updateAdminDashboard();
  showEventModal(event);
};
const renderIdeas = () => {
  const board = $('#idea-wall');
  if (!board) return;
  board.innerHTML = '';
  voteTopics.forEach((topic) => {
    const column = document.createElement('section');
    column.className = 'idea-column';
    column.dataset.topic = topic.key;
    const heading = document.createElement('h4');
    heading.textContent = topic.title;
    column.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'idea-column__list';
    const ideas = state.ideas
      .filter((idea) => idea.topic === topic.key)
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    if (!ideas.length) {
      const empty = document.createElement('p');
      empty.className = 'idea-column__empty';
      empty.textContent = '尚無提案';
      list.appendChild(empty);
    } else {
      let reactionsMutated = false;
      ideas.forEach((idea) => {
        const card = document.createElement('article');
        card.dataset.ideaId = idea.id;
        let reaction = state.ideaReactions[idea.id];
        if (!reaction || typeof reaction !== 'object') {
          reaction = {
            support: reaction === 'support',
            concern: reaction === 'concern'
          };
          state.ideaReactions[idea.id] = reaction;
          reactionsMutated = true;
        }
        const hasReacted = reaction.support || reaction.concern;
        card.className = `idea-card${hasReacted ? ' idea-card--locked' : ''}`;
        const supportButton = `<button type="button" class="idea-pill${reaction.support ? ' is-selected' : ''
          }" data-action="support" data-idea="${idea.id}" ${hasReacted ? 'disabled' : ''}>
            支持 <span>${idea.support}</span>
          </button>`;
        const concernButton = `<button type="button" class="idea-pill${reaction.concern ? ' is-selected' : ''
          }" data-action="concern" data-idea="${idea.id}" ${hasReacted ? 'disabled' : ''}>
            疑慮 <span>${idea.concern}</span>
          </button>`;
        const actionButtons = `${supportButton}${concernButton}`;
        const deleteButton = adminOpen
          ? `<button type="button" class="idea-card__delete" data-action="delete-idea" data-idea="${idea.id}" aria-label="刪除提案">×</button>`
          : '';
        card.innerHTML = `
          ${deleteButton}
          <div class="idea-card__meta">支持 ${idea.support} ｜ 疑慮 ${idea.concern}</div>
          <h4>${idea.title}</h4>
          <p>${idea.description || '（尚未補充說明）'}</p>
          <div class="idea-card__actions">
            ${actionButtons}
          </div>
        `;
        list.appendChild(card);
      });
      if (reactionsMutated) {
        persistState();
      }
    }
    column.appendChild(list);
    board.appendChild(column);
  });
};
const fetchIdeas = async () => {
  try {
    const data = await apiRequest('/ideas');
    const sorted = Array.isArray(data)
      ? data
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : [];
    state.ideas = sorted;
    renderIdeas();
    updateAdminDashboard();
  } catch (error) {
    console.warn('Failed to load ideas', error);
  }
};
const sortIdeasInState = () => {
  state.ideas.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};
const fetchSessions = async () => {
  try {
    const data = await apiRequest('/sessions');
    state.sessionLogs = Array.isArray(data)
      ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : [];
    updateAdminDashboard();
  } catch (error) {
    console.warn('Failed to load sessions', error);
  }
};
const createIdea = async ({ title, description, topic }) => {
  const idea = await apiRequest('/ideas', {
    method: 'POST',
    body: JSON.stringify({ title, description, topic })
  });
  state.ideas.push(idea);
  sortIdeasInState();
  renderIdeas();
  updateAdminDashboard();
};
const updateIdeaInState = (updated) => {
  const index = state.ideas.findIndex((idea) => idea.id === updated.id);
  if (index >= 0) {
    state.ideas[index] = updated;
  } else {
    state.ideas.push(updated);
  }
  sortIdeasInState();
  renderIdeas();
  updateAdminDashboard();
};
const removeIdeaFromState = (ideaId) => {
  state.ideas = state.ideas.filter((idea) => idea.id !== ideaId);
  if (state.ideaReactions[ideaId]) {
    delete state.ideaReactions[ideaId];
  }
  persistState();
  renderIdeas();
  updateAdminDashboard();
};
const reactIdea = async (ideaId, type) => {
  const updated = await apiRequest(`/ideas/${ideaId}/react`, {
    method: 'POST',
    body: JSON.stringify({ type })
  });
  updateIdeaInState(updated);
};
const deleteIdea = async (ideaId) => {
  await apiRequest(`/ideas/${ideaId}`, {
    method: 'DELETE'
  });
  removeIdeaFromState(ideaId);
};
const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
const buildSessionCsvRows = () => {
  const headers = [
    'timestamp',
    'preferences',
    'baseline_votes',
    'baseline_IFI',
    'baseline_SSI',
    'baseline_MPI',
    'baseline_PP_spent',
    'post_votes',
    'post_IFI',
    'post_SSI',
    'post_MPI',
    'post_PP_spent',
    'diff_IFI',
    'diff_SSI',
    'diff_MPI',
    'diff_PP',
    'events'
  ];
  const rows = state.sessionLogs.map((entry) => {
    const timestamp = (() => {
      if (!entry.createdAt) return '';
      const parsed = new Date(entry.createdAt);
      return Number.isNaN(parsed.getTime())
        ? entry.createdAt
        : parsed.toLocaleString('zh-TW', { hour12: false });
    })();
    const preferenceStr = Object.entries(entry.preferences || {})
      .filter(([, choice]) => Boolean(choice))
      .map(([issue, choice]) => {
        const topicLabel = voteTopics.find((topic) => topic.key === issue)?.title ?? issue;
        const choiceLabel = introChoiceLabels[issue]?.[choice] ?? choice;
        return `${topicLabel}→${choiceLabel}`;
      })
      .join(' | ');
    const serializeVotes = (votes = {}) =>
      voteTopics.map((topic) => `${topic.key}:${votes[topic.key] ?? 0}`).join(' | ');
    const baselineVotes = serializeVotes(entry.baseline?.votes);
    const postVotes = serializeVotes(entry.postEvent?.votes);
    const baselineMetrics = entry.baseline?.metrics ?? {};
    const postMetrics = entry.postEvent?.metrics ?? {};
    const diff = entry.diff ?? {};
    const eventStr = Array.isArray(entry.events)
      ? entry.events.map((evt) => evt.title || evt.id).join(' | ')
      : '';
    return [
      timestamp,
      preferenceStr,
      baselineVotes,
      baselineMetrics.ifi ?? '',
      baselineMetrics.ssi ?? '',
      baselineMetrics.mpi ?? '',
      baselineMetrics.totalCost ?? '',
      postVotes,
      postMetrics.ifi ?? '',
      postMetrics.ssi ?? '',
      postMetrics.mpi ?? '',
      postMetrics.totalCost ?? '',
      diff.ifi ?? '',
      diff.ssi ?? '',
      diff.mpi ?? '',
      diff.ppSpent ?? '',
      eventStr
    ];
  });
  return [headers, ...rows];
};
const exportSessionsToCsv = () => {
  if (!state.sessionLogs.length) {
    window.alert('目前尚無可匯出的參與紀錄。');
    return;
  }
  const rows = buildSessionCsvRows();
  const lines = rows.map((row) => row.map(escapeCsv).join(','));
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateTag = new Date().toISOString().slice(0, 10);
  link.download = `session-logs-${dateTag}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
const populateIdeaTopicSelect = () => {
  const select = document.getElementById('idea-topic');
  if (!select) return;
  const options = voteTopics
    .map((topic) => `<option value="${topic.key}">${topic.title}</option>`)
    .join('');
  select.innerHTML = `<option value="" disabled selected>選擇議題</option>${options}`;
  select.selectedIndex = 0;
};
const handleIdeaAction = async (event) => {
  const button = event.target.closest('.idea-pill[data-action]');
  if (!button) return;
  const card = button.closest('.idea-card');
  const actionButtons = card
    ? Array.from(card.querySelectorAll('.idea-pill[data-action]'))
    : [button];
  const action = button.dataset.action;
  const ideaId = button.dataset.idea;
  if (!action || !ideaId) return;
  const idea = state.ideas.find((entry) => entry.id === ideaId);
  if (!idea) return;
  const existingReaction = state.ideaReactions[ideaId] ?? { support: false, concern: false };
  if (existingReaction.support || existingReaction.concern) {
    window.alert('你已經對這個提案表達過意見。');
    return;
  }
  actionButtons.forEach((btn) => {
    btn.disabled = true;
  });
  button.classList.add('is-selected');
  try {
    await reactIdea(ideaId, action);
    state.ideaReactions[ideaId] = {
      ...existingReaction,
      [action]: true
    };
    persistState();
  } catch (error) {
    actionButtons.forEach((btn) => {
      btn.disabled = false;
    });
    button.classList.remove('is-selected');
    window.alert(error.message ?? '送出失敗，請稍後再試');
  }
};
const renderFeedbackList = (type) => {
  const id = type === 'institutional' ? 'institution-feedback-list' : 'exhibition-feedback-list';
  const list = document.getElementById(id);
  if (!list) return;
  const entries = state.feedback[type];
  list.innerHTML = '';
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '尚無留言。';
    list.appendChild(li);
    return;
  }
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry.message;
    list.appendChild(li);
  });
};
const handleFeedbackSubmit = (type, event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const textArea = form.querySelector('textarea');
  if (!textArea) return;
  const value = textArea.value.trim();
  if (!value) return;
  submitFeedback(type, value)
    .then(() => {
      textArea.value = '';
    })
    .catch((error) => {
      window.alert(error.message ?? '送出失敗，請稍後再試');
    });
};
const fetchFeedback = async (type) => {
  try {
    const endpoint = type === 'institutional' ? '/feedback/institutional' : '/feedback/exhibition';
    const data = await apiRequest(endpoint);
    state.feedback[type] = Array.isArray(data) ? data : [];
    renderFeedbackList(type);
  } catch (error) {
    console.warn('Failed to load feedback', type, error);
  }
};
const submitFeedback = async (type, message) => {
  const endpoint = type === 'institutional' ? '/feedback/institutional' : '/feedback/exhibition';
  const entry = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  state.feedback[type].unshift(entry);
  if (state.feedback[type].length > 50) {
    state.feedback[type].pop();
  }
  renderFeedbackList(type);
  updateAdminDashboard();
};
const checkStageOneCompletion = () => {
  const selectedCount = Object.values(state.preferences).reduce(
    (count, value) => (value ? count + 1 : count),
    0
  );
  const button = $('[data-action="to-stage"][data-target="2"]');
  if (button) {
    button.disabled = selectedCount < MIN_REQUIRED_INTRO_SELECTIONS;
  }
};
const handlePreferenceSelection = (event) => {
  const button = event.target.closest('[data-choice]');
  if (!button) return;
  const card = button.closest('.issue-card');
  if (!card) return;
  const issue = card.dataset.issue;
  if (!issue) return;
  const choice = button.dataset.choice;
  state.preferences[issue] = choice;
  card.querySelectorAll('[data-choice]').forEach((candidate) => {
    candidate.classList.toggle('is-selected', candidate === button);
  });
  card.classList.add('is-complete');
  checkStageOneCompletion();
  updateAdminDashboard();
};
const getOutcomeClassification = (baseline, post, diff) => {
  if (!baseline || !post) {
    return {
      title: '等待分析',
      description: '完成所有階段後，系統會根據兩輪投票與事件影響生成結果敘事。'
    };
  }
  if (post.ifi >= 75 && post.mpi >= 70 && post.ssi >= 65) {
    return {
      title: '共榮制度',
      description: '制度公平、社會穩定與弱勢參與皆獲提升，改革朝向共榮社會前進。'
    };
  }
  if (post.ssi < 45) {
    return {
      title: '制度震盪',
      description: '社會穩定指數大幅下滑，事件導致的衝擊正在撕裂既有秩序。'
    };
  }
  if (post.ifi < 45) {
    return {
      title: '制度僵化',
      description: '制度公平指數顯著下降，再分配失衡，改革陷入僵固。'
    };
  }
  if (diff.mpi >= 8) {
    return {
      title: '制度轉向中',
      description: '弱勢參與指數明顯提升，群眾共創正在撼動舊制度。'
    };
  }
  if (diff.ifi <= -10) {
    return {
      title: '信任坍塌',
      description: '事件催化下，制度公平急遽下滑，需要新一輪協議與監督機制。'
    };
  }
  return {
    title: '臨界中的制度',
    description: '制度指數拉扯互抵，仍停留在臨界狀態，下一步取決於後續行動。'
  };
};
const formatDiff = (value) => {
  if (Number.isNaN(value)) return '—';
  if (value > 0) return `+${Math.round(value)}`;
  return `${Math.round(value)}`;
};
const computeOutcome = () => {
  const baseline = state.roundMetrics.baseline;
  const post = state.roundMetrics.postEvent;
  if (!baseline || !post) {
    return {
      title: '等待分析',
      description: '完成所有階段後，系統會根據兩輪投票與事件影響生成結果敘事。',
      baseline: null,
      post: null,
      diff: null
    };
  }
  const diff = {
    ifi: post.ifi - baseline.ifi,
    ssi: post.ssi - baseline.ssi,
    mpi: post.mpi - baseline.mpi,
    ppSpent: post.totalCost - baseline.totalCost
  };
  const classification = getOutcomeClassification(baseline, post, diff);
  return {
    title: classification.title,
    description: classification.description,
    baseline,
    post,
    diff
  };
};
const renderOutcome = () => {
  const outcome = computeOutcome();
  $('#outcome-title').textContent = outcome.title;
  const descriptionEl = $('#outcome-description');
  if (descriptionEl) {
    if (state.eventCard) {
      descriptionEl.textContent = `${outcome.description}（事件：${state.eventCard.title}）`;
    } else {
      descriptionEl.textContent = outcome.description;
    }
  }
  if (!outcome.baseline || !outcome.post || !outcome.diff) {
    ['baseline-ifi', 'baseline-ssi', 'baseline-mpi', 'baseline-pp-spent'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    ['post-ifi', 'post-ssi', 'post-mpi', 'post-pp-spent'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    ['diff-ifi', 'diff-ssi', 'diff-mpi', 'diff-pp-spent'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    return;
  }
  const { baseline, post, diff } = outcome;
  $('#baseline-ifi').textContent = Math.round(baseline.ifi);
  $('#baseline-ssi').textContent = Math.round(baseline.ssi);
  $('#baseline-mpi').textContent = Math.round(baseline.mpi);
  $('#baseline-pp-spent').textContent = Math.round(baseline.totalCost);
  $('#post-ifi').textContent = Math.round(post.ifi);
  $('#post-ssi').textContent = Math.round(post.ssi);
  $('#post-mpi').textContent = Math.round(post.mpi);
  $('#post-pp-spent').textContent = Math.round(post.totalCost);
  $('#diff-ifi').textContent = formatDiff(diff.ifi);
  $('#diff-ssi').textContent = formatDiff(diff.ssi);
  $('#diff-mpi').textContent = formatDiff(diff.mpi);
  $('#diff-pp-spent').textContent = formatDiff(diff.ppSpent);
  updateAdminDashboard();
};
const resetIntroSelections = () => {
  $$('.issue-card').forEach((card) => {
    card.classList.remove('is-complete');
    card.querySelectorAll('[data-choice]').forEach((button) => {
      button.classList.remove('is-selected');
    });
  });
};
const resetEventUI = () => {
  const history = $('#event-history');
  if (history) history.innerHTML = '';
  const summary = $('#event-summary');
  if (summary) summary.textContent = defaultEventSummary;
  const postBoard = $('#post-vote-board');
  if (postBoard) postBoard.hidden = true;
  clearRoundMessage('postEvent');
  hideEventModal();
};
const hasMeaningfulVotes = (votes) => voteTopics.some((topic) => (votes?.[topic.key] ?? 0) !== 0);
const buildVoteSnapshot = (votes) =>
  voteTopics.reduce((acc, topic) => {
    acc[topic.key] = votes?.[topic.key] ?? 0;
    return acc;
  }, {});
const buildSessionSnapshot = () => {
  const baselineMetrics = { ...calculateRoundMetrics('baseline') };
  const postMetrics = { ...calculateRoundMetrics('postEvent') };
  const diff = {
    ifi: postMetrics.ifi - baselineMetrics.ifi,
    ssi: postMetrics.ssi - baselineMetrics.ssi,
    mpi: postMetrics.mpi - baselineMetrics.mpi,
    ppSpent: postMetrics.totalCost - baselineMetrics.totalCost
  };
  return {
    preferences: { ...state.preferences },
    baseline: {
      votes: buildVoteSnapshot(state.roundVotes.baseline),
      metrics: baselineMetrics,
      locked: state.lockedRounds.baseline
    },
    postEvent: {
      votes: buildVoteSnapshot(state.roundVotes.postEvent),
      metrics: postMetrics,
      locked: state.lockedRounds.postEvent,
      modifiers: { ...state.eventModifiers }
    },
    diff,
    events: [...state.eventHistory]
  };
};
const shouldRecordSession = () => {
  const preferenceCount = Object.values(state.preferences).filter(Boolean).length;
  return (
    preferenceCount > 0 ||
    hasMeaningfulVotes(state.roundVotes.baseline) ||
    hasMeaningfulVotes(state.roundVotes.postEvent) ||
    state.lockedRounds.baseline ||
    state.lockedRounds.postEvent ||
    state.eventHistory.length > 0
  );
};
const submitSessionSnapshot = async () => {
  if (!shouldRecordSession()) return;
  try {
    const payload = buildSessionSnapshot();
    const result = await apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (result) {
      state.sessionLogs.unshift(result);
      updateAdminDashboard();
    }
  } catch (error) {
    console.warn('Failed to record session snapshot', error);
  }
};
const restartExperience = async () => {
  await submitSessionSnapshot();
  const preservedSessions = [...state.sessionLogs];
  const freshState = createInitialState();
  Object.keys(state).forEach((key) => {
    state[key] = freshState[key];
  });
  state.ideaReactions = {};
  state.sessionLogs = preservedSessions;
  hero.style.display = '';
  renderVoteBoards();
  renderIdeas();
  renderFeedbackList('institutional');
  renderFeedbackList('exhibition');
  updateRoundStatus('baseline');
  updateRoundStatus('postEvent');
  resetIntroSelections();
  resetEventUI();
  initDeck();
  checkStageOneCompletion();
  clearRoundMessage('baseline');
  clearRoundMessage('postEvent');
  syncRoundControls();
  populateIdeaTopicSelect();
  timeline.goTo(0);
  window.scrollTo({ top: hero.offsetTop ?? 0, behavior: 'smooth' });
  persistState();
  try {
    window.localStorage.removeItem(storageKeys.ideaReactions);
  } catch (error) {
    /* ignore */
  }
  try {
    await loadInitialData();
  } catch (error) {
    console.warn('Failed to reload data after restart', error);
  }
};
let adminOpen = false;
const formatList = (items) => (items.length ? items.join('\n') : '—');
const renderAdminDashboard = () => {
  if (!adminOpen) return;
  const container = $('#admin-content');
  if (!container) return;

  const choiceStats = voteTopics.map((topic) => {
    const options = Object.entries(introChoiceLabels[topic.key] ?? {}).map(([value, label]) => ({
      value,
      label,
      count: 0
    }));
    const optionLookup = new Map(options.map((option) => [option.value, option]));
    state.sessionLogs.forEach((entry) => {
      const selected = entry.preferences?.[topic.key];
      if (selected && optionLookup.has(selected)) {
        optionLookup.get(selected).count += 1;
      }
    });
    return {
      title: topic.title,
      options
    };
  });

  const voteStats = voteTopics.map((topic) => {
    const totals = state.sessionLogs.reduce(
      (acc, entry) => {
        const baselineValue = Number(entry.baseline?.votes?.[topic.key] ?? 0);
        const postValue = Number(entry.postEvent?.votes?.[topic.key] ?? 0);
        acc.baseline += baselineValue;
        acc.post += postValue;
        return acc;
      },
      { baseline: 0, post: 0 }
    );
    return { ...totals, label: topic.title };
  });

  const eventAggregates = new Map();
  state.sessionLogs.forEach((entry) => {
    const hasBaseline = Boolean(entry.baseline?.locked);
    const hasPost = Boolean(entry.postEvent?.locked);
    (entry.events ?? []).forEach((event) => {
      const id = event.id || event.title;
      if (!id) return;
      if (!eventAggregates.has(id)) {
        eventAggregates.set(id, {
          label: event.title || id,
          type: event.type || '事件',
          countBaseline: 0,
          countPost: 0
        });
      }
      const aggregate = eventAggregates.get(id);
      if (hasBaseline) aggregate.countBaseline += 1;
      if (hasPost) aggregate.countPost += 1;
    });
  });
  const eventStats = Array.from(eventAggregates.values());

  const maxChoiceValue = Math.max(
    1,
    ...choiceStats.flatMap((stat) => stat.options.map((option) => option.count))
  );

  const maxVoteValue = Math.max(
    1,
    ...voteStats.map((stat) => Math.max(Math.abs(stat.baseline), Math.abs(stat.post)))
  );
  const maxEventValue = Math.max(
    1,
    ...eventStats.map((stat) => Math.max(stat.countBaseline, stat.countPost))
  );
  const maxProposalValue = Math.max(
    1,
    ...state.ideas.map((idea) => Math.max(idea.support ?? 0, idea.concern ?? 0))
  );

  const ideaManagement = state.ideas.length
    ? state.ideas
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((idea) => {
          const topicLabel = voteTopics.find((topic) => topic.key === idea.topic)?.title ?? idea.topic;
          const timestamp = (() => {
            const parsed = new Date(idea.createdAt);
            return Number.isNaN(parsed.getTime())
              ? '未知時間'
              : parsed.toLocaleString('zh-TW', { hour12: false });
          })();
          return `
            <li class="admin-idea-item" data-idea-id="${idea.id}">
              <div class="admin-idea-meta">
                <strong>${idea.title}</strong>
                <span>${topicLabel}</span>
                <span>支持 ${idea.support} ｜ 疑慮 ${idea.concern}</span>
                <small>${timestamp}</small>
              </div>
              <div class="admin-idea-actions">
                <button type="button" class="admin-idea-delete" data-action="admin-delete-idea" data-idea="${idea.id}">刪除</button>
              </div>
            </li>`;
        })
        .join('')
    : '<li class="admin-idea-item"><div class="admin-idea-meta"><strong>尚無提案</strong></div></li>';

  const choiceChart = choiceStats
    .map((stat) => {
      const hasData = stat.options.some((option) => option.count > 0);
      if (!stat.options.length || !hasData) {
        return `
          <div class="admin-choice-topic">
            <h4>${stat.title}</h4>
            <p class="admin-choice-empty">尚無選擇資料</p>
          </div>`;
      }
      const list = stat.options
        .map(
          (option) => `
            <li class="admin-choice-item">
              <header>
                <span>${option.label}</span>
                <span>${option.count} 人</span>
              </header>
              <div class="admin-chart__bars admin-chart__bars--choice">
                <div class="admin-chart__bar">
                  <div class="admin-chart__bar-fill admin-chart__bar-fill--choice" style="transform: scaleX(${option.count / maxChoiceValue});"></div>
                </div>
              </div>
            </li>`
        )
        .join('');
      return `
        <div class="admin-choice-topic">
          <h4>${stat.title}</h4>
          <ul class="admin-choice-list">
            ${list}
          </ul>
        </div>`;
    })
    .join('');

  const eventChart = eventStats.length
    ? eventStats
        .map(
          (stat) => `
            <div class="admin-chart__row">
              <div class="admin-chart__label">
                <span>${stat.label}</span>
                <span>${stat.type} ｜ 事件前 ${stat.countBaseline} 次 ｜ 事件後 ${stat.countPost} 次</span>
              </div>
              <div class="admin-chart__bars">
                <div class="admin-chart__bar">
                  <div class="admin-chart__bar-fill admin-chart__bar-fill--event" style="transform: scaleX(${stat.countBaseline / maxEventValue});"></div>
                </div>
                <div class="admin-chart__bar">
                  <div class="admin-chart__bar-fill admin-chart__bar-fill--event-post" style="transform: scaleX(${stat.countPost / maxEventValue});"></div>
                </div>
              </div>
            </div>`
        )
        .join('')
    : '<p class="admin-choice-empty">尚未抽出任何事件。</p>';

  const proposalChart = voteTopics.map((topic) => {
    const ideas = state.ideas.filter((idea) => idea.topic === topic.key);
    if (!ideas.length) {
      return `
        <div class="admin-chart__topic">
          <h4>${topic.title}</h4>
          <p class="admin-chart__empty">尚無提案資料</p>
        </div>`;
    }
    const items = ideas
      .map(
        (idea) => `
          <li class="admin-proposal-item">
            <div class="admin-proposal-header">
              <strong>${idea.title}</strong>
              <span>支持 ${idea.support} ｜ 疑慮 ${idea.concern}</span>
            </div>
            <p>${idea.description || '（尚未補充說明）'}</p>
            <div class="admin-chart__bars admin-chart__bars--proposal">
              <div class="admin-chart__bar">
                <div class="admin-chart__bar-fill admin-chart__bar-fill--support" style="transform: scaleX(${(idea.support ?? 0) / maxProposalValue});"></div>
              </div>
              <div class="admin-chart__bar">
                <div class="admin-chart__bar-fill admin-chart__bar-fill--concern" style="transform: scaleX(${(idea.concern ?? 0) / maxProposalValue});"></div>
              </div>
            </div>
          </li>`
      )
      .join('');

    return `
      <div class="admin-chart__topic">
        <h4>${topic.title}</h4>
        <ul class="admin-proposal-list">
          ${items}
        </ul>
      </div>`;
  });

  const safeMetric = (value) => (Number.isFinite(value) ? Math.round(value) : '—');
  const safeDiff = (value) => (Number.isFinite(value) ? formatDiff(value) : '—');
  const formatPreferences = (preferences = {}) => {
    const lines = Object.entries(preferences)
      .filter(([, choice]) => Boolean(choice))
      .map(([issue, choice]) => {
        const topicLabel = voteTopics.find((topic) => topic.key === issue)?.title ?? issue;
        const choiceLabel = introChoiceLabels[issue]?.[choice] ?? choice;
        return `    • ${topicLabel} → ${choiceLabel}`;
      });
    return lines.length ? lines.join('\n') : '    • 未選擇';
  };
  const formatVoteValue = (value) => (value > 0 ? `+${value}` : `${value}`);
  const formatVotesPerTopic = (baselineVotes = {}, postVotes = {}) =>
    voteTopics.map((topic) => {
      const before = Number(baselineVotes[topic.key] ?? 0);
      const after = Number(postVotes[topic.key] ?? 0);
      return `    • ${topic.title}：事件前 ${formatVoteValue(before)} ｜ 事件後 ${formatVoteValue(after)}`;
    });
  const sessionSummary = state.sessionLogs.map((entry, idx) => {
    let timestamp = '未知時間';
    if (entry.createdAt) {
      const parsed = new Date(entry.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        timestamp = parsed.toLocaleString('zh-TW', { hour12: false });
      }
    }
    const baseline = entry.baseline?.metrics ?? {};
    const post = entry.postEvent?.metrics ?? {};
    const diff = entry.diff ?? {};
    const resolveDiff = (key) => {
      if (Number.isFinite(diff[key])) return diff[key];
      if (Number.isFinite(post[key]) && Number.isFinite(baseline[key])) {
        return post[key] - baseline[key];
      }
      return null;
    };
    const eventTitles =
      Array.isArray(entry.events) && entry.events.length
        ? entry.events.map((item) => item.title).join('、')
        : '尚未抽事件卡';
    const preferenceBlock = formatPreferences(entry.preferences);
    const voteLines = formatVotesPerTopic(entry.baseline?.votes ?? {}, entry.postEvent?.votes ?? {});
    const voteBlock = voteLines.join('\n');
    return `${idx + 1}. ${timestamp}\n  議題選擇：\n${preferenceBlock}\n  投票：\n${voteBlock}\n  指數：IFI ${safeMetric(baseline.ifi)} → ${safeMetric(post.ifi)} (${safeDiff(resolveDiff('ifi'))}) ｜ SSI ${safeMetric(baseline.ssi)} → ${safeMetric(post.ssi)} (${safeDiff(resolveDiff('ssi'))}) ｜ MPI ${safeMetric(baseline.mpi)} → ${safeMetric(post.mpi)} (${safeDiff(resolveDiff('mpi'))})\n  投入 PP：${safeMetric(baseline.totalCost)} → ${safeMetric(post.totalCost)}（剩餘 ${safeMetric(baseline.remainingPP ?? baseline.totalPP ?? 0)}）\n  事件：${eventTitles}`;
  });

  container.innerHTML = `
    <section class="admin-section">
      <h3>議題選擇概覽</h3>
      <div class="admin-chart">
        ${choiceChart}
      </div>
    </section>
    <section class="admin-section">
      <h3>事件干預概覽</h3>
      <div class="admin-chart">
        ${eventChart}
        ${eventStats.length
          ? '<div class="admin-chart__legend"><span data-type="event">事件前</span><span data-type="event-post">事件後</span></div>'
          : ''}
      </div>
    </section>
    <section class="admin-section">
      <h3>平方投票概覽</h3>
      <div class="admin-chart">
        ${voteStats
          .map(
            (stat) => `
          <div class="admin-chart__row">
            <div class="admin-chart__label">
              <span>${stat.label}</span>
              <span>事件前 ${formatVoteValue(stat.baseline)} ｜ 事件後 ${formatVoteValue(stat.post)}</span>
            </div>
            <div class="admin-chart__bars">
              <div class="admin-chart__bar">
                <div class="admin-chart__bar-fill admin-chart__bar-fill--baseline" style="transform: scaleX(${Math.abs(stat.baseline) / maxVoteValue});"></div>
              </div>
              <div class="admin-chart__bar">
                <div class="admin-chart__bar-fill admin-chart__bar-fill--post" style="transform: scaleX(${Math.abs(stat.post) / maxVoteValue});"></div>
              </div>
            </div>
          </div>`
          )
          .join('')}
        <div class="admin-chart__legend">
          <span data-type="baseline">事件前</span>
          <span data-type="post">事件後</span>
        </div>
      </div>
    </section>
    <section class="admin-section">
      <h3>提案支持概覽</h3>
      <div class="admin-chart">
        ${proposalChart.join('')}
        <div class="admin-chart__legend">
          <span data-type="support">支持</span>
          <span data-type="concern">疑慮</span>
        </div>
      </div>
    </section>
    <section class="admin-section">
      <h3>提案管理</h3>
      <ul class="admin-idea-list">
        ${ideaManagement}
      </ul>
    </section>
    <section class="admin-section">
      <h3>參與紀錄</h3>
      <button type="button" class="admin-export" data-action="export-sessions" ${
        state.sessionLogs.length ? '' : 'disabled'
      }>下載 CSV</button>
      <pre>${sessionSummary.length ? sessionSummary.join('\n\n') : '尚無紀錄。'}</pre>
    </section>
  `;
};
const updateAdminDashboard = () => {
  if (adminOpen) {
    renderAdminDashboard();
  }
};
const loadInitialData = async () => {
  await Promise.all([
    fetchIdeas(),
    fetchFeedback('institutional'),
    fetchFeedback('exhibition'),
    fetchSessions()
  ]);
  updateAdminDashboard();
};
const handleStageNavigation = async (event) => {
  const restartBtn = event.target.closest('[data-action="restart-experience"]');
  if (restartBtn) {
    await restartExperience();
    return;
  }
  const lockBtn = event.target.closest('[data-action="lock-round"]');
  if (lockBtn) {
    const round = lockBtn.dataset.round;
    if (round === 'baseline' || round === 'postEvent') {
      lockRound(round);
    }
    return;
  }
  const resetBtn = event.target.closest('[data-action="reset-round"]');
  if (resetBtn) {
    const round = resetBtn.dataset.round;
    if (round === 'baseline' || round === 'postEvent') {
      resetRound(round);
    }
    return;
  }
  const toStageBtn = event.target.closest('[data-action="to-stage"]');
  if (toStageBtn) {
    const target = Number(toStageBtn.dataset.target);
    if (!Number.isNaN(target)) {
      timeline.goTo(target - 1);
      window.scrollTo({ top: experience.offsetTop - 40, behavior: 'smooth' });
    }
  }
};
const handleVoteClick = (event) => {
  const button = event.target.closest('.vote-btn');
  if (!button) return;
  const direction = Number(button.dataset.direction);
  if (Number.isNaN(direction)) return;
  const card = button.closest('.vote-card');
  if (!card) return;
  const topic = card.dataset.topic;
  const round = card.dataset.round;
  if (!topic || !round) return;
  adjustVote(round, topic, direction);
};
const handleIdeaBoardClick = async (event) => {
  const deleteButton = event.target.closest('[data-action="delete-idea"]');
  if (deleteButton) {
    const ideaId = deleteButton.dataset.idea;
    if (!ideaId) return;
    const idea = state.ideas.find((entry) => entry.id === ideaId);
    if (!idea) return;
    const confirmed = window.confirm(`確定要刪除「${idea.title}」嗎？此操作無法復原。`);
    if (!confirmed) return;
    try {
      await deleteIdea(ideaId);
    } catch (error) {
      window.alert(error.message ?? '刪除提案失敗，請稍後再試');
    }
    return;
  }
  handleIdeaAction(event);
};
const handleAdminContentClick = async (event) => {
  const deleteButton = event.target.closest('[data-action="admin-delete-idea"]');
  if (deleteButton) {
    const ideaId = deleteButton.dataset.idea;
    const idea = state.ideas.find((entry) => entry.id === ideaId);
    if (!idea) return;
    const confirmed = window.confirm(`確定要刪除「${idea.title}」嗎？此操作無法復原。`);
    if (!confirmed) return;
    try {
      await deleteIdea(ideaId);
      window.alert('已刪除提案。');
    } catch (error) {
      window.alert(error.message ?? '刪除提案失敗，請稍後再試');
    }
    return;
  }
  const exportButton = event.target.closest('[data-action="export-sessions"]');
  if (exportButton) {
    exportSessionsToCsv();
  }
};
const handleIdeaFormSubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const topic = form.topic.value;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  if (!topic) {
    window.alert('請先選擇議題');
    return;
  }
  if (!title) {
    window.alert('請輸入提案標題');
    return;
  }
  try {
    await createIdea({ topic, title, description });
    form.reset();
    populateIdeaTopicSelect();
  } catch (error) {
    window.alert(error.message ?? '新增提案失敗，請稍後再試');
  }
};
const init = async () => {
  renderVoteBoards();
  renderIdeas();
  renderFeedbackList('institutional');
  renderFeedbackList('exhibition');
  clearRoundMessage('baseline');
  clearRoundMessage('postEvent');
  updateRoundStatus('baseline');
  updateRoundStatus('postEvent');
  initDeck();
  checkStageOneCompletion();
  syncRoundControls();
  populateIdeaTopicSelect();
  await loadInitialData();
  persistState();
  closeAdminPanel();
  $('#intro-issues').addEventListener('click', handlePreferenceSelection);
  $('#vote-columns-baseline').addEventListener('click', handleVoteClick);
  $('#vote-columns-post').addEventListener('click', handleVoteClick);
  $('#idea-wall').addEventListener('click', handleIdeaBoardClick);
  const ideaForm = document.getElementById('idea-form');
  if (ideaForm) {
    ideaForm.addEventListener('submit', handleIdeaFormSubmit);
  }
  $('#draw-event').addEventListener('click', drawEvent);
  $('#close-modal').addEventListener('click', hideEventModal);
  $('#event-modal').addEventListener('click', (event) => {
    if (event.target.classList.contains('modal__backdrop')) {
      hideEventModal();
    }
  });
  $('[data-action="start-experience"]').addEventListener('click', () => {
    hero.style.display = 'none';
    timeline.goTo(0);
    window.scrollTo({ top: experience.offsetTop - 40, behavior: 'smooth' });
  });
  $('#institution-feedback-form').addEventListener('submit', (event) =>
    handleFeedbackSubmit('institutional', event)
  );
  $('#exhibition-feedback-form').addEventListener('submit', (event) =>
    handleFeedbackSubmit('exhibition', event)
  );
  document.body.addEventListener('click', handleStageNavigation);
  window.scrollTo({ top: 0 });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => console.error(error));
  });
} else {
  init().catch((error) => console.error(error));
}
const openAdminPanel = () => {
  const overlay = $('#admin-overlay');
  if (!overlay) return;
  adminOpen = true;
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.style.display = 'grid';
  renderAdminDashboard();
  renderIdeas();
};
const closeAdminPanel = () => {
  const overlay = $('#admin-overlay');
  if (!overlay) return;
  adminOpen = false;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';
  renderIdeas();
};
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-admin');
  const closeBtn = document.getElementById('close-admin');
  const overlay = document.getElementById('admin-overlay');
  const adminContent = document.getElementById('admin-content');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const input = window.prompt('請輸入管理密碼');
      if (input === ADMIN_PASSWORD) {
        openAdminPanel();
      } else if (input !== null) {
        window.alert('密碼錯誤');
      }
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAdminPanel);
  }
  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeAdminPanel();
      }
    });
  }
  if (adminContent) {
    adminContent.addEventListener('click', handleAdminContentClick);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && adminOpen) {
    closeAdminPanel();
  }
});
