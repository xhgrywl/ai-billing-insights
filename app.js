const initialBills = [
  { date: '11-12', category: '餐饮', note: '午餐', amount: 38 },
  { date: '11-11', category: '交通', note: '地铁出行', amount: 12 },
  { date: '11-10', category: '订阅', note: '云盘会员', amount: 28 },
  { date: '11-09', category: '购物', note: '学习用品', amount: 156 },
  { date: '11-08', category: '餐饮', note: '周末聚餐', amount: 118 },
  { date: '11-07', category: '学习', note: '课程资料', amount: 64 },
];

const palette = { 餐饮: '#635bff', 交通: '#2fc6b4', 购物: '#ff9f5a', 订阅: '#ec6f96', 学习: '#4e7cff' };
const dailySpend = [164, 223, 296, 178, 235, 122, 348];
let bills = JSON.parse(localStorage.getItem('aiBillingBills') || 'null') || initialBills;
let role = 'user';

function activateRole(nextRole) {
  role = nextRole;
  document.querySelectorAll('.role-btn').forEach((item) => item.classList.toggle('selected', item.dataset.role === role));
  document.querySelectorAll('.admin-only').forEach((item) => item.style.display = role === 'admin' ? 'block' : 'none');
  document.querySelector('#profile-name').textContent = role === 'admin' ? '管理员 · 系统后台' : '吴嘉森';
  document.querySelector('#profile-avatar').textContent = role === 'admin' ? '管' : '吴';
  document.querySelector('[data-panel="dashboard"]').click();
  if (role === 'admin') document.querySelector('[data-panel="admin"]').click();
}

function totalSpend() { return bills.reduce((sum, bill) => sum + bill.amount, 0); }
function currency(value) { return `¥${value.toLocaleString('zh-CN')}`; }
function categoryTotals() { return bills.reduce((result, bill) => ({ ...result, [bill.category]: (result[bill.category] || 0) + bill.amount }), {}); }

function renderSummary() {
  const total = totalSpend();
  const rate = Math.min(Math.round((total / 4000) * 100), 100);
  document.querySelector('#total-spend').textContent = currency(total);
  document.querySelector('#remaining').textContent = currency(Math.max(0, 4000 - total));
  document.querySelector('#budget-rate').textContent = `${rate}%`;
  document.querySelector('#donut-total').textContent = currency(total);
}

function renderCharts() {
  const chart = document.querySelector('#trend-chart');
  chart.innerHTML = dailySpend.map((value) => `<div class="bar" data-value="${currency(value)}" style="height:${Math.max(24, value / 1.8)}px"></div>`).join('');
  const adminChart = document.querySelector('#admin-chart');
  adminChart.innerHTML = [42, 58, 64, 51, 74, 86, 93].map((value) => `<div class="bar" data-value="${value} 位活跃用户" style="height:${value * 1.85}px"></div>`).join('');
}

function renderCategories() {
  const totals = categoryTotals();
  const total = totalSpend();
  document.querySelector('#category-legend').innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => `<li><span><i style="background:${palette[category] || '#8993ac'}"></i>${category}</span><b>${Math.round((value / total) * 100)}%</b></li>`).join('');
}

function renderBills() {
  document.querySelector('#bill-table').innerHTML = [...bills]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((bill) => `<tr><td>${bill.date}</td><td><span class="tag">${bill.category}</span></td><td>${bill.note}</td><td class="amount">${currency(bill.amount)}</td></tr>`).join('');
}

function renderInsights() {
  const totals = categoryTotals();
  const total = totalSpend();
  const leading = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const rate = Math.round((total / 4000) * 100);
  const cards = [
    ['◎', '消费集中度', `${leading[0]}占本月支出的 ${Math.round((leading[1] / total) * 100)}%，是金额最高的类别。可以先从该类别设置单周上限。`],
    ['↗', '预算进度', `当前已使用月度预算的 ${rate}%。按近七日平均支出估算，本月结余可以覆盖日常开销。`],
    ['✦', 'AI 建议', totals.订阅 ? `发现 ${currency(totals.订阅)} 的订阅支出。建议在续费前评估使用频率，避免闲置服务自动续费。` : '建议每周检查一次账单分类，持续积累数据后可以获得更准确的建议。'],
  ];
  document.querySelector('#insight-cards').innerHTML = cards.map(([symbol, title, copy]) => `<article class="insight-card"><div class="insight-symbol">${symbol}</div><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderAll() { renderSummary(); renderCharts(); renderCategories(); renderBills(); renderInsights(); }

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => {
  const panel = button.dataset.panel;
  if (panel === 'admin' && role !== 'admin') return;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  document.querySelectorAll('.panel').forEach((item) => item.classList.toggle('visible', item.id === panel));
  document.querySelector('#page-title').textContent = button.textContent;
}));

document.querySelectorAll('.role-btn').forEach((button) => button.addEventListener('click', () => {
  activateRole(button.dataset.role);
}));

document.querySelectorAll('[data-login-role]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('#login-screen').style.display = 'none';
  document.querySelector('#app-shell').classList.remove('is-hidden');
  activateRole(button.dataset.loginRole);
}));

document.querySelector('#logout-btn').addEventListener('click', () => {
  document.querySelector('#app-shell').classList.add('is-hidden');
  document.querySelector('#login-screen').style.display = 'grid';
});

const dialog = document.querySelector('#bill-dialog');
document.querySelector('#open-add-bill').addEventListener('click', () => dialog.showModal());
document.querySelector('#bill-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = Number(document.querySelector('#bill-amount').value);
  if (!amount) return;
  bills.push({ date: '11-12', category: document.querySelector('#bill-category').value, note: document.querySelector('#bill-note').value, amount });
  localStorage.setItem('aiBillingBills', JSON.stringify(bills));
  dailySpend[6] += amount;
  dialog.close(); event.target.reset(); renderAll();
});
document.querySelector('#open-insights').addEventListener('click', () => document.querySelector('[data-panel="insights"]').click());
document.querySelector('#refresh-insights').addEventListener('click', renderInsights);
renderAll();
