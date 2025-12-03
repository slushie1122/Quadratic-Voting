import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const VOICE_CREDITS = 100;
const SUPABASE_URL = 'https://ajhskxfarxgebfbthtke.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaHNreGZhcnhnZWJmYnRodGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzA2MjQsImV4cCI6MjA4MDM0NjYyNH0.GeblW3Cnm3USBNYz3MVVTOKVGbx43evMHPIn83TbEb0';
const TABLE_NAME = 'votes';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const topics = [
  {
    key: 'education',
    title: '課綱一致化改革',
    subtitle: '統一教材 vs 多元聲音',
    description: '統一課綱被視為提升競爭力的手段，但也可能壓抑多元文化與在地語言。'
  },
  {
    key: 'environment',
    title: '海岸風電擴張案',
    subtitle: '低碳與漁權衝突',
    description: '離岸風電帶來綠能，同時擠壓漁業生計與海洋生態。'
  },
  {
    key: 'tax',
    title: '高收入者追加稅',
    subtitle: '再分配或人才出走',
    description: '加稅支持弱勢，卻可能引發人才與資金外流。'
  },
  {
    key: 'surveillance',
    title: '城市 AI 監控網',
    subtitle: '公共安全與隱私界線',
    description: '智慧監控提升治安，也讓政府監控公民更容易。'
  },
  {
    key: 'housing',
    title: '住宅限購與租金上限',
    subtitle: '守護居住 vs 市場失靈',
    description: '限制短租與多屋，青年支持，房東憂心供給縮水。'
  },
  {
    key: 'immigration',
    title: '移工長期居留配額',
    subtitle: '產業需求與社會承擔',
    description: '提高居留配額穩定勞動力，但社會承擔與融合成為疑慮。'
  },
  {
    key: 'speech',
    title: '數位言論平台責任',
    subtitle: '假訊息與言論自由',
    description: '要求平台快速下架爭議內容，可能降低誤導，也可能演變為政治審查。'
  },
  {
    key: 'healthcare',
    title: '健康資料共享政策',
    subtitle: '公共安全與個人隱私',
    description: '疫苗護照與資料交換有助防疫，但個資與差別待遇風險升高。'
  }
];

const createEmptyVotes = () =>
  topics.reduce((acc, topic) => {
    acc[topic.key] = 0;
    return acc;
  }, {});

const state = {
  votes: createEmptyVotes()
};

const totalCost = (votes) =>
  topics.reduce((sum, topic) => {
    const v = votes[topic.key] ?? 0;
    return sum + v * v;
  }, 0);

const remainingCredits = () => Math.max(0, VOICE_CREDITS - totalCost(state.votes));

const formatCost = (value, inline = false) =>
  inline ? `花費：${value * value} VC` : `成本 ${value * value} VC`;
const formatVoteValue = (value) => (value > 0 ? `+${value}` : `${value}`);

const renderBoard = () => {
  const container = $('#vote-columns');
  if (!container) return;
  container.innerHTML = '';
  topics.forEach((topic) => {
    const card = document.createElement('article');
    card.className = 'vote-card';
    card.dataset.topic = topic.key;
    card.innerHTML = `
      <div class="vote-card__header">
        <h3>${topic.title}</h3>
        <p>${topic.subtitle}</p>
      </div>
      <div class="vote-controls">
        <button class="vote-btn" data-direction="-1" aria-label="對 ${topic.title} 投負票">−</button>
        <output class="vote-count" id="vote-count-${topic.key}">0</output>
        <button class="vote-btn" data-direction="1" aria-label="對 ${topic.title} 投正票">＋</button>
        <span class="vote-cost-inline" id="vote-cost-${topic.key}">${formatCost(0, true)}</span>
      </div>
      <p class="vote-note">${topic.description}</p>
    `;
    container.appendChild(card);
  });
};

const updateStatus = () => {
  const totalEl = $('#vc-total');
  const remainEl = $('#vc-remaining');
  const costEl = $('#vc-cost');
  const remaining = remainingCredits();
  const spent = VOICE_CREDITS - remaining;
  if (totalEl) totalEl.textContent = VOICE_CREDITS;
  if (remainEl) remainEl.textContent = remaining;
  if (costEl) costEl.textContent = spent;
  topics.forEach((topic) => {
    const val = state.votes[topic.key] ?? 0;
    const countEl = document.getElementById(`vote-count-${topic.key}`);
    const costEl = document.getElementById(`vote-cost-${topic.key}`);
    if (countEl) countEl.textContent = formatVoteValue(val);
    if (costEl) costEl.textContent = formatCost(Math.abs(val), true);
  });
  renderSummary();
  renderWarning();
};

const renderWarning = () => {
  const warningEl = $('#vc-warning');
  if (!warningEl) return;
  const remaining = remainingCredits();
  if (remaining === 0) {
    warningEl.textContent = '你的 100 VC 已全數投入。要調整時，請先收回其他議題的票。';
  } else if (remaining <= 10) {
    warningEl.textContent = `還剩 ${remaining} VC，請確認是否要集中火力或保留作為安全墊。`;
  } else {
    warningEl.textContent = '';
  }
};

const renderSummary = () => {
  const summaryEl = $('#summary-list');
  if (!summaryEl) return;
  const sorted = [...topics]
    .map((topic) => ({
      ...topic,
      value: state.votes[topic.key] ?? 0,
      abs: Math.abs(state.votes[topic.key] ?? 0)
    }))
    .sort((a, b) => {
      if (b.abs !== a.abs) return b.abs - a.abs; // 絕對值大的在前
      if (b.value !== a.value) return b.value - a.value; // 同絕對值時正票優先
      return a.title.localeCompare(b.title);
    })
    .filter((item) => item.abs > 0)
    .slice(0, 3);

  if (!sorted.length) {
    summaryEl.innerHTML = '<li>尚未投入，先從最在乎的議題開始。</li>';
    return;
  }

  summaryEl.innerHTML = sorted
    .map(
      (item) => {
        const votesText = `${item.value > 0 ? '+' : ''}${item.value} 票（${
          item.value * item.value
        } VC）`;
        return `<li><strong>${item.title}</strong>：<span class="summary-count">${votesText}</span></li>`;
      }
    )
    .join('');
};

const adjustVote = (topicKey, direction) => {
  const current = state.votes[topicKey] ?? 0;
  const proposed = current + direction;
  const projectedVotes = { ...state.votes, [topicKey]: proposed };
  const cost = totalCost(projectedVotes);
  if (cost > VOICE_CREDITS) {
    const message = $('#vc-feedback');
    if (message) {
      message.textContent = '發言權不足，請收回其他議題或降低票數。';
      setTimeout(() => {
        if (message.textContent === '發言權不足，請收回其他議題或降低票數。') {
          message.textContent = '';
        }
      }, 2200);
    }
    return;
  }
  state.votes[topicKey] = proposed;
  updateStatus();
};

const resetVotes = () => {
  state.votes = createEmptyVotes();
  updateStatus();
};

const submitCurrentVotes = async () => {
  const spent = VOICE_CREDITS - remainingCredits();
  const feedback = document.getElementById('vc-feedback');
  if (spent <= 0) {
    if (feedback) {
      feedback.textContent = '至少投入 1 VC 才能送出。';
      setTimeout(() => {
        if (feedback.textContent === '至少投入 1 VC 才能送出。') {
          feedback.textContent = '';
        }
      }, 2000);
    }
    return;
  }
  const { error } = await supabase.from(TABLE_NAME).insert({ votes: { ...state.votes } });
  if (error) {
    if (feedback) {
      feedback.textContent = '送出失敗，請稍後再試。';
      setTimeout(() => {
        if (feedback.textContent === '送出失敗，請稍後再試。') {
          feedback.textContent = '';
        }
      }, 2400);
    }
    return;
  }
  if (feedback) {
    feedback.textContent = '已送出並記錄至雲端，統計頁可查看。';
    setTimeout(() => {
      if (feedback.textContent === '已送出並記錄至雲端，統計頁可查看。') {
        feedback.textContent = '';
      }
    }, 2400);
  }
  resetVotes();
};

const handleBoardClick = (event) => {
  const button = event.target.closest('.vote-btn');
  if (!button) return;
  const direction = Number(button.dataset.direction);
  if (Number.isNaN(direction)) return;
  const card = button.closest('.vote-card');
  if (!card) return;
  const topic = card.dataset.topic;
  adjustVote(topic, direction);
};

const themeStorageKey = 'qv-theme';
const applyTheme = (theme) => {
  const normalized = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', normalized);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = normalized === 'light' ? '切換為黑底' : '切換為白底';
    toggle.setAttribute('aria-label', normalized === 'light' ? '切換為黑底' : '切換為白底');
  }
  try {
    window.localStorage.setItem(themeStorageKey, normalized);
  } catch (error) {
    /* ignore persistence errors */
  }
};

const initTheme = () => {
  let stored = null;
  try {
    stored = window.localStorage.getItem(themeStorageKey);
  } catch (error) {
    stored = null;
  }
  applyTheme(stored || 'dark');
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  }
};

const setup = () => {
  initTheme();
  renderBoard();
  updateStatus();
  const board = $('#vote-columns');
  if (board) board.addEventListener('click', handleBoardClick);
  const resetBtn = $('#reset-votes');
  if (resetBtn) resetBtn.addEventListener('click', resetVotes);
  const submitBtn = $('#submit-votes');
  if (submitBtn) submitBtn.addEventListener('click', submitCurrentVotes);
  const startBtn = $('[data-action="start-experiment"]');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const target = document.getElementById('experiment');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}

const openDashboardWithPassword = () => {
  const pass = window.prompt('請輸入查看即時統計的密碼');
  if (pass === 'admin') {
    window.open('./dashboard.html', '_blank');
  } else if (pass !== null) {
    window.alert('密碼錯誤');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', openDashboardWithPassword);
  }
});
