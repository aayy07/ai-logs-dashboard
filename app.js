// Application state
let currentLogs = [];
let filteredLogs = [];
let charts = {};
let darkMode = false;
let realTimeInterval = null;

// DOM elements
let logFeed, anomalyList, darkModeToggle;
let logSearch, logLevelFilter, logSourceFilter;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function () {
  initializeDOMElements();
  await loadInitialLogs();
  initializeApplication();
});

// Fetch sampleData.json asynchronously
async function loadInitialLogs() {
  try {
    console.log("Loading logs from JSON...");
    const res = await fetch("sampleData.json");
    const data = await res.json();
    currentLogs = data.logs || [];
    filteredLogs = [...currentLogs];
    console.log(`Loaded ${currentLogs.length} logs from JSON`);
  } catch (err) {
    console.error("Failed to load logs:", err);
  }
}

// Initialize DOM element references
function initializeDOMElements() {
  logFeed = document.getElementById('logFeed');
  anomalyList = document.getElementById('anomalyList');
  darkModeToggle = document.getElementById('darkModeToggle');
  logSearch = document.getElementById('logSearch');
  logLevelFilter = document.getElementById('logLevelFilter');
  logSourceFilter = document.getElementById('logSourceFilter');
}

// Initialize the application
function initializeApplication() {
  renderLogs();
  generateMetrics();
  generateChartData();
  analyzeLogsWithAI(filteredLogs.slice(-50)); // use filteredLogs
  setupEventListeners();
  startRealTimeUpdates();
}

// Render logs in the feed
function renderLogs() {
  if (!logFeed) return;
  const logs = filteredLogs.slice(-50).reverse();
  logFeed.innerHTML = '';
  logs.forEach(log => {
    const logElement = document.createElement('div');
    logElement.className = 'log-entry';
    logElement.innerHTML = `
      <div class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</div>
      <div class="log-level log-level--${log.level.toLowerCase()}">${log.level}</div>
      <div class="log-source">${log.source}</div>
      <div class="log-message">${log.message}</div>
    `;
    logFeed.appendChild(logElement);
  });
}

// Generate metrics dynamically from logs (use filtered list)
function generateMetrics() {
  const totalLogs = filteredLogs.length;
  const errorCount = filteredLogs.filter(log => log.level === "ERROR").length;

  const systemHealth = Math.max(50, Math.min(100, 100 - (errorCount / (totalLogs || 1)) * 100));

  const responseTimes = filteredLogs.map(log => {
    const match = log.message.match(/(\d+\.\d+)s/);
    return match ? parseFloat(match[1]) * 1000 : null;
  }).filter(rt => rt !== null);

  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a,b) => a + b, 0) / responseTimes.length)
    : 0;

  document.getElementById('totalLogs').textContent = totalLogs.toLocaleString();
  document.getElementById('activeAnomalies').textContent = errorCount;
  document.getElementById('systemHealth').textContent = Math.round(systemHealth) + '%';
  document.getElementById('avgResponseTime').textContent = Math.round(avgResponseTime) + 'ms';
}

// Generate chart data dynamically (use filtered list)
function generateChartData() {
  const hoursMap = {};
  const errorMap = {};
  filteredLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hoursMap[hour] = (hoursMap[hour] || 0) + 1;

    if (log.level === "ERROR") {
      const key = log.message.split(" ")[0];
      errorMap[key] = (errorMap[key] || 0) + 1;
    }
  });

  const logVolumeLabels = Object.keys(hoursMap).sort();
  const logVolumeData = logVolumeLabels.map(h => hoursMap[h]);
  const errorLabels = Object.keys(errorMap);
  const errorData = errorLabels.map(k => errorMap[k]);

  if (typeof Chart !== 'undefined') {
    const logVolumeCanvas = document.getElementById('logVolumeChart');
    if (logVolumeCanvas) {
      const ctx = logVolumeCanvas.getContext('2d');
      if (charts.logVolume) charts.logVolume.destroy();
      charts.logVolume = new Chart(ctx, {
        type: 'line',
        data: {
          labels: logVolumeLabels,
          datasets: [{ label: 'Log Volume', data: logVolumeData, borderColor: '#1FB8CD' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const errorDistCanvas = document.getElementById('errorDistributionChart');
    if (errorDistCanvas) {
      const ctx2 = errorDistCanvas.getContext('2d');
      if (charts.errorDistribution) charts.errorDistribution.destroy();
      charts.errorDistribution = new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: errorLabels,
          datasets: [{ data: errorData, backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
}

// AI backend call
async function analyzeLogsWithAI(logs) {
  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs })
    });
    const data = await response.json();
    renderAIResults(data);
  } catch (e) {
    console.error("Error calling AI API:", e);
  }
}

// Render AI anomalies
function renderAIResults(data) {
  anomalyList.innerHTML = "";
  data.anomalies.forEach(anomaly => {
    const div = document.createElement("div");
    div.className = "anomaly-item anomaly-item--warning";
    div.innerHTML = `
      <div><b>${anomaly.log.source}</b> - ${anomaly.log.level}</div>
      <div>${anomaly.log.message}</div>
      <div><em>${anomaly.reason}</em></div>
    `;
    anomalyList.appendChild(div);
  });
  document.getElementById("activeAnomalies").textContent = data.anomalies.length;
}

// Filter logs based on search and filters, and update everything
function filterLogs() {
  const searchTerm = logSearch ? logSearch.value.toLowerCase().trim() : '';
  const levelFilterVal = logLevelFilter ? logLevelFilter.value.trim() : '';
  const sourceFilterVal = logSourceFilter ? logSourceFilter.value.trim() : '';

  filteredLogs = currentLogs.filter(log => {
    const messageMatch = !searchTerm || log.message.toLowerCase().includes(searchTerm);
    const sourceMatchSearch = !searchTerm || log.source.toLowerCase().includes(searchTerm);
    const searchMatch = messageMatch || sourceMatchSearch;
    const levelMatch = !levelFilterVal || log.level === levelFilterVal;
    const sourceMatch = !sourceFilterVal || log.source === sourceFilterVal;
    return searchMatch && levelMatch && sourceMatch;
  });

  renderLogs();
  generateMetrics();       // 📊 Update cards with filteredLogs
  generateChartData();     // 📈 Update charts with filteredLogs
  analyzeLogsWithAI(filteredLogs.slice(-50)); // 🤖 AI works on filteredLogs
}

// Events setup
function setupEventListeners() {
  if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);
  if (logSearch) logSearch.addEventListener('input', filterLogs);
  if (logLevelFilter) logLevelFilter.addEventListener('change', filterLogs);
  if (logSourceFilter) logSourceFilter.addEventListener('change', filterLogs);
}

// Real-time updates simulation
function startRealTimeUpdates() {
  realTimeInterval = setInterval(() => {
    generateNewLog();
    filterLogs(); // Instead of manually calling metrics/charts, just filter to refresh view
  }, 5000);
}

// Generate a new random log
function generateNewLog() {
  const sources = ['nginx', 'mysql', 'app', 'k8s'];
  const template = { level: 'INFO', message: 'GET /api/data 200 0.045s' };
  const newLog = {
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    source: sources[Math.floor(Math.random() * sources.length)],
    level: template.level,
    message: template.message
  };
  currentLogs.push(newLog);
}
