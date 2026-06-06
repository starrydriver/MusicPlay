type ScoreEntry = {
  name: string;
  score: number;
  createdAt: number;
};

type SubmitResult = {
  success: boolean;
  message?: string;
};

type RankingServiceApi = {
  submitScore: (name: string, score: number) => Promise<SubmitResult>;
  refresh: () => void;
  getEntries: () => ScoreEntry[];
};

declare global {
  interface Window {
    RankingService?: RankingServiceApi;
  }
}

export {};

const API_BASE = 'https://api.starrydriver.com';
const SAVE_URL = `${API_BASE}/api/Score/save`;
const PAGE_SIZE = 10;

let cachedEntries: ScoreEntry[] = [];
let currentPage = 1;

async function diagnoseApis(): Promise<void> {
  const endpoints = [
    { name: 'root', url: `${API_BASE}/` },
    { name: 'ping', url: `${API_BASE}/ping` },
    { name: 'debug', url: `${API_BASE}/debug` },
    { name: 'weatherforecast', url: `${API_BASE}/weatherforecast` },
    { name: 'score list', url: `${API_BASE}/api/Score/list` },
  ];

  console.group('[Ranking API] connectivity check');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();
      console.log(endpoint.name, {
        url: endpoint.url,
        ok: response.ok,
        status: response.status,
        body,
      });
    } catch (error) {
      console.error(endpoint.name, endpoint.url, error);
    }
  }
  console.groupEnd();
}

function normalizeEntries(entries: unknown): ScoreEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      const candidate = entry as Partial<ScoreEntry>;
      return {
        name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : '匿名玩家',
        score: Number.isFinite(candidate.score) ? Number(candidate.score) : 0,
        createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : Date.now(),
      };
    })
    .sort((left, right) => right.score - left.score || left.createdAt - right.createdAt);
}

function getPageCount(entries: ScoreEntry[]): number {
  return Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
}

function renderList(entries: ScoreEntry[], page: number, listEl: HTMLElement, pageInfoEl?: HTMLElement | null, countEl?: HTMLElement | null, prevButton?: HTMLButtonElement | null, nextButton?: HTMLButtonElement | null): void {
  const totalPages = getPageCount(entries);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(startIndex, startIndex + PAGE_SIZE);

  listEl.innerHTML = pageEntries.length
    ? pageEntries
        .map((entry, index) => {
          const rank = startIndex + index + 1;
          return `<li><span>${rank}. ${entry.name}: <strong>${entry.score}</strong></span></li>`;
        })
        .join('')
    : '<li><span>暂无记录</span><strong>-</strong></li>';

  if (pageInfoEl) {
    pageInfoEl.textContent = `${currentPage}/${totalPages}`;
  }

  if (countEl) {
    countEl.textContent = `共 ${entries.length} 条`;
  }

  if (prevButton) {
    prevButton.disabled = currentPage <= 1;
  }

  if (nextButton) {
    nextButton.disabled = currentPage >= totalPages;
  }
}

function renderCompactList(entries: ScoreEntry[], listEl: HTMLElement): void {
  const pageEntries = entries.slice(0, PAGE_SIZE);

  listEl.innerHTML = pageEntries.length
    ? pageEntries
        .map((entry, index) => `<li><span>${index + 1}. ${entry.name}: <strong>${entry.score}</strong></span></li>`)
        .join('')
    : '<li><span>暂无记录</span><strong>-</strong></li>';
}

function loadRemoteEntries(): Promise<ScoreEntry[]> {
  return fetch(`${API_BASE}/api/Score/list`)
    .then((response) => (response.ok ? response.json() : []))
    .then((data) => normalizeEntries(data))
    .catch(() => []);
}

async function submitScore(name: string, score: number): Promise<SubmitResult> {
  const cleanName = name.trim() || '匿名玩家';
  const payload = { name: cleanName, score };

  try {
    const response = await fetch(SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`保存失败：${response.status}`);
    }

    await refresh();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '上传失败',
    };
  }
}

async function refresh(): Promise<void> {
  const homeListEl = document.getElementById('rankingList');
  const pageInfoEl = document.getElementById('rankingPageInfo');
  const countEl = document.getElementById('rankingCount');
  const prevButton = document.getElementById('rankingPrev');
  const nextButton = document.getElementById('rankingNext');
  const compactListEl = document.getElementById('leaderboardList');

  const entries = await loadRemoteEntries();
  cachedEntries = entries;

  if (homeListEl instanceof HTMLElement) {
    const totalPages = getPageCount(entries);
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    renderList(
      entries,
      currentPage,
      homeListEl,
      pageInfoEl,
      countEl,
      prevButton instanceof HTMLButtonElement ? prevButton : null,
      nextButton instanceof HTMLButtonElement ? nextButton : null
    );

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.onclick = () => {
        currentPage = Math.max(1, currentPage - 1);
        void refresh();
      };
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.onclick = () => {
        currentPage = Math.min(totalPages, currentPage + 1);
        void refresh();
      };
    }
  }

  if (compactListEl instanceof HTMLElement) {
    renderCompactList(entries, compactListEl);
  }
}

window.RankingService = {
  submitScore,
  refresh,
  getEntries: () => cachedEntries,
};

document.addEventListener('DOMContentLoaded', () => {
  void refresh();
  void diagnoseApis();
});