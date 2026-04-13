// GAS Web App URL (생성된 최신 배포 주소)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxe0rYf6CSKvfT7XL9EsA5-cnx6XwUfgp7yooI7Pdi2BSAapqWuNQ4azRu8VzSsOxuxTg/exec";

const App = {
  container: null,

  init: function() {
    this.container = document.getElementById('app');
    
    // 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', () => {
      this.route();
    });

    // 모든 클릭 이벤트 가로채기 (SPA 라우팅용)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('?')) {
        e.preventDefault();
        const href = a.getAttribute('href');
        window.history.pushState(null, '', href);
        this.route();
      }
    });

    // 첫 진입 시 라우팅
    this.route();
  },

  showLoading: function() {
    this.container.innerHTML = `
      <header>
        <div class="skeleton skeleton-title"></div>
      </header>
      <div class="container fade-in">
        <h2 class="skeleton" style="width: 150px; margin-top:40px;"></h2>
        <div class="card-grid">
          <div class="card skeleton skeleton-card"></div>
          <div class="card skeleton skeleton-card"></div>
          <div class="card skeleton skeleton-card"></div>
        </div>
      </div>
    `;
  },

  showError: function(msg) {
    this.container.innerHTML = `
      <div class="container fade-in" style="margin-top: 50px; text-align: center;">
        <h2>오류 발생 😢</h2>
        <p style="color: red;">${msg}</p>
        <a href="?page=home" class="button">홈으로 돌아가기</a>
      </div>
    `;
  },

  route: async function() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    const id = params.get('id') || '';

    this.showLoading();

    try {
      const url = `${GAS_API_URL}?page=${page}&id=${id}`;
      // 서버에서 JSON 데이터를 가져옵니다. GAS의 CORS 리다이렉트를 지원하기 위해 기본 fetch 사용.
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.status !== 'success') {
        throw new Error(json.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      }

      const data = json.data;
      if (data.config && data.config.APP_TITLE) {
        document.title = data.config.APP_TITLE;
      }

      if (page === 'home') this.renderHome(data);
      else if (page === 'tool') this.renderTool(data);
      else this.renderHome(data);

    } catch (err) {
      console.error(err);
      this.showError("데이터를 가져올 수 없습니다. 인터넷 설정을 확인하거나 잠시 후 다시 시도해주세요. (" + err.message + ")");
    }
  },

  renderHome: function(data) {
    const config = data.config || {};
    const tools = data.tools || [];
    const projects = data.projects || [];

    let html = `
      <header class="fade-in">
        <h1>✨ ${config.APP_TITLE || '티쳐스 바이브'}</h1>
        <div class="subtitle">${config.APP_DESC || '선생님들을 위한 AI 코딩 학습 공동체'}</div>
      </header>
      <div class="container fade-in">
    `;

    if (config.MAIN_BANNER || config.NOTICE) {
      html += `<div class="notice-box">`;
      if (config.MAIN_BANNER) html += `<p><strong>💡 ${config.MAIN_BANNER}</strong></p>`;
      if (config.NOTICE) html += `<p>📢 ${config.NOTICE}</p>`;
      html += `</div>`;
    }

    // 도구 섹션
    html += `<h2>도구 선택</h2><div class="card-grid">`;
    if (tools.length > 0) {
      tools.forEach(t => {
        html += `
          <a href="?page=tool&id=${t.tool_id}" class="card">
            <span class="card-icon">${t.icon || '🚀'}</span>
            <div class="card-title">${t.tool_name}</div>
            <div class="card-desc">${t.summary || ''}</div>
          </a>
        `;
      });
    } else {
      html += `<p style="color:var(--text-muted); font-size:0.9rem;">등록된 도구가 없습니다.</p>`;
    }
    html += `</div>`;

    // 실습 자물 및 웹앱
    html += `<h2>실습 자료 및 웹앱</h2><div class="card-grid">`;
    if (projects.length > 0) {
      projects.forEach(p => {
        html += `
          <a href="${p.folder_url}" target="_blank" class="card">
            <span class="card-icon">📁</span>
            <div class="card-title">${p.project_title}</div>
            <div class="card-desc">${p.description || ''}</div>
          </a>
        `;
      });
    } else {
      html += `<p style="color:var(--text-muted); font-size:0.9rem;">프로젝트 자료가 없습니다.</p>`;
    }
    html += `</div>`;

    html += `
        <footer>
          <p>모든 내용 수정은 원본 Google Sheet에서 가능합니다.</p>
          <a href="${config.SHEET_URL || '#'}" target="_blank" class="button secondary" style="margin-top:14px;">✏️ 데이터 시트 열기</a>
        </footer>
      </div>
    `;

    this.container.innerHTML = html;
  },

  renderTool: function(data) {
    const config = data.config || {};
    const tool = data.tool || {};
    const blocks = data.blocks || [];
    const rules = data.rules || [];
    const prompts = data.prompts || [];
    const links = data.links || [];

    let html = `
      <div class="container fade-in">
        <div class="nav-bar">
          <a href="?page=home" class="back-btn">⬅ 뒤로 가기</a>
        </div>
        
        <div class="tool-hero">
          <div class="tool-hero-icon">${tool.icon || '🚀'}</div>
          <div>
            <h2>${tool.tool_name}</h2>
            <p>${tool.summary || ''}</p>
          </div>
        </div>
    `;

    // Blocks
    blocks.forEach(b => {
      html += `
        <div class="section-block">
          <h3>${b.section_title}</h3>
          <p style="white-space: pre-wrap;">${b.body_markdown_or_text || ''}</p>
          ${b.button_label ? `<a href="${b.button_url}" target="_blank" class="button">${b.button_label}</a>` : ''}
        </div>
      `;
    });

    // Rules
    if (rules.length > 0) {
      html += `<h2>시스템 규칙</h2>`;
      rules.forEach(r => {
        html += `
          <div class="section-block" style="border-style: dashed;">
            <div style="font-weight: 800; margin-bottom: 8px; font-size: 1.1rem; color: var(--accent);">
              ${r.rule_title} ${r.recommended ? '<span class="badge-required">적용 권장</span>' : ''}
            </div>
            <p>${r.rule_text || ''}</p>
          </div>
        `;
      });
    }

    // Prompts
    if (prompts.length > 0) {
      html += `<h2>추천 프롬프트</h2>`;
      prompts.forEach((p, idx) => {
        html += `
          <div class="section-block">
            <h3 style="background:var(--banana); color:var(--text);">${p.prompt_title}</h3>
            ${p.copy_enabled ? 
              `<div class="copy-box-wrapper">
                 <button class="copy-btn" onclick="App.copyText('prompt_${idx}')">Copy</button>
                 <div class="copy-box" id="prompt_${idx}">${p.prompt_text}</div>
               </div>` 
              : `<div class="copy-box">${p.prompt_text}</div>`}
          </div>
        `;
      });
    }

    // Links
    if (links.length > 0) {
      html += `<h2>관련 자료</h2><ul class="links-list">`;
      links.forEach(lk => {
        html += `
          <li>
            <a href="${lk.link_url}" target="_blank">
              <div>
                ${lk.link_title}
                <span class="link-desc">${lk.description || ''}</span>
              </div>
            </a>
          </li>
        `;
      });
      html += `</ul>`;
    }

    html += `
        <footer>
          <p>이 도구의 정보는 시트에서 수정할 수 있습니다.</p>
          <a href="${config.SHEET_URL || '#'}" target="_blank" class="button secondary" style="margin-top:14px;">🛠 도구 정보 수정</a>
        </footer>
      </div>
    `;

    this.container.innerHTML = html;
  },

  copyText: function(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const txt = el.innerText || el.textContent;
    navigator.clipboard.writeText(txt).then(() => {
      alert("복사되었습니다!");
    }).catch(err => {
      alert("복사에 실패했습니다.");
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
