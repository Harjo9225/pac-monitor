// app.js
// Funzioni di utilità
function showSpinner() {
  document.getElementById('spinner').style.display = 'block';
}

function hideSpinner() {
  document.getElementById('spinner').style.display = 'none';
}

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.style.display = 'block';
  setTimeout(() => {
    successEl.style.display = 'none';
  }, 3000);
}

// Gestione IndexedDB
let db;
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FinanceDB", 1);
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function saveData(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readwrite");
    const store = tx.objectStore("records");
    const request = store.add(record);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

function loadData() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readonly");
    const store = tx.objectStore("records");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function clearDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readwrite");
    const store = tx.objectStore("records");
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Gestione autenticazione migliorata
async function hashPin(pin) {
  // In produzione usare algoritmo più sicuro come PBKDF2
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setPin(pin) {
  const hashedPin = await hashPin(pin);
  localStorage.setItem('pin', hashedPin);
}

async function verifyPin(pin) {
  const storedPin = localStorage.getItem('pin');
  if (!storedPin) return false;
  
  const hashedPin = await hashPin(pin);
  return hashedPin === storedPin;
}

async function login(pin) {
  if (!pin) return false;
  
  const storedPin = localStorage.getItem('pin');
  if (!storedPin) {
    // Primo accesso: registra il PIN
    await setPin(pin);
    return true;
  }
  
  // Verifica
  return await verifyPin(pin);
}

function logout() {
  localStorage.removeItem('pin');
  location.reload();
}

function isLoggedIn() {
  return !!localStorage.getItem('pin');
}

// Gestione biometria con WebAuthn
async function setupBiometrics() {
  if (!window.PublicKeyCredential) {
    console.log("Biometria non supportata");
    return false;
  }
  
  try {
    // Verifica se l'utente ha già una chiave registrata
    const hasCredentials = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        rpId: window.location.hostname,
        allowCredentials: []
      }
    });
    
    if (hasCredentials) {
      console.log("Biometria già registrata");
      return true;
    }
  } catch (e) {
    console.log("Biometria non registrata");
  }
  return false;
}

async function authenticateWithBiometrics() {
  try {
    showSpinner();
    
    // Simulazione di autenticazione biometrica
    // In produzione qui ci sarebbe la logica reale con WebAuthn
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulazione di autenticazione riuscita
    return true;
  } catch (e) {
    console.error("Errore autenticazione biometrica:", e);
    return false;
  } finally {
    hideSpinner();
  }
}

// Gestione IO (export/import completo)
async function exportData() {
  try {
    showSpinner();
    
    // Esportiamo sia i dati di IndexedDB che il PIN (hash)
    const dbData = await loadData();
    const exportObject = {
      version: 1,
      dbData,
      pinHash: localStorage.getItem('pin')
    };
    
    const blob = new Blob([JSON.stringify(exportObject)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pacmonitor_export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showSuccess('exportSuccess', 'Esportazione completata con successo!');
  } catch (e) {
    showError('exportError', "Errore durante l'esportazione: " + e.message);
  } finally {
    hideSpinner();
  }
}

async function importData(file) {
  try {
    showSpinner();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Importa i dati di IndexedDB
        if (data.dbData && Array.isArray(data.dbData)) {
          await clearDB(); // Cancella i dati correnti
          for (const record of data.dbData) {
            await saveData(record);
          }
        }
        
        // Importa il PIN (se presente)
        if (data.pinHash) {
          localStorage.setItem('pin', data.pinHash);
        }
        
        showSuccess('importSuccess', 'Importazione completata con successo!');
      } catch (e) {
        showError('importError', "Formato file non valido: " + e.message);
      }
    };
    reader.readAsText(file);
  } catch (e) {
    showError('importError', "Errore durante l'importazione: " + e.message);
  } finally {
    hideSpinner();
  }
}

// Gestione ricerca mercato
async function searchMarket(query) {
  try {
    showSpinner();
    
    if (!query || query.trim() === '') {
      // Reset della griglia
      renderMarketGrid();
      return;
    }
    
    // Simulazione risultati di ricerca
    const results = [
      { description: "Vanguard FTSE All-World UCITS ETF", symbol: "VWCE" },
      { description: "iShares Core MSCI World UCITS ETF", symbol: "IWDA" },
      { description: "Lyxor Core MSCI World UCITS ETF", symbol: "LCWD" },
      { description: "Amundi MSCI World UCITS ETF", symbol: "CW8" },
      { description: "SPDR S&P 500 ETF Trust", symbol: "SPY" }
    ].filter(item => 
      item.description.toLowerCase().includes(query.toLowerCase()) || 
      item.symbol.toLowerCase().includes(query.toLowerCase())
    );
    
    // Render dei risultati
    renderSearchResults(results);
  } catch (e) {
    showError('searchError', "Errore durante la ricerca: " + e.message);
  } finally {
    hideSpinner();
  }
}

function renderMarketGrid() {
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = `
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-globe-europe"></i> Indici Globali</h4>
        <span class="market-change positive"><i class="fas fa-caret-up"></i> +1.2%</span>
      </div>
      <div class="market-value">€ 4,851.23</div>
      <div class="market-info">MSCI World Index</div>
    </div>
    
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-building"></i> S&P 500</h4>
        <span class="market-change positive"><i class="fas fa-caret-up"></i> +0.8%</span>
      </div>
      <div class="market-value">$ 4,567.89</div>
      <div class="market-info">USA Large Cap</div>
    </div>
    
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-coins"></i> Oro</h4>
        <span class="market-change negative"><i class="fas fa-caret-down"></i> -0.3%</span>
      </div>
      <div class="market-value">$ 1,932.50</div>
      <div class="market-info">Prezzo per oncia</div>
    </div>
    
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-oil-well"></i> Petrolio</h4>
        <span class="market-change positive"><i class="fas fa-caret-up"></i> +2.1%</span>
      </div>
      <div class="market-value">$ 85.67</div>
      <div class="market-info">Brent Crude</div>
    </div>
    
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-euro-sign"></i> EUR/USD</h4>
        <span class="market-change negative"><i class="fas fa-caret-down"></i> -0.4%</span>
      </div>
      <div class="market-value">1.0872</div>
      <div class="market-info">Tasso di cambio</div>
    </div>
    
    <div class="market-card">
      <div class="market-card-header">
        <h4><i class="fas fa-landmark"></i> BTP Italia</h4>
        <span class="market-change positive"><i class="fas fa-caret-up"></i> +0.6%</span>
      </div>
      <div class="market-value">€ 102.35</div>
      <div class="market-info">Rendimento 3.5%</div>
    </div>
  `;
}

function renderSearchResults(results) {
  const grid = document.getElementById('marketGrid');
  
  if (results.length === 0) {
    grid.innerHTML = `<div class="no-results">Nessun risultato trovato per la tua ricerca</div>`;
    return;
  }
  
  grid.innerHTML = results.map(item => `
    <div class="market-card search-result">
      <h4>${item.symbol}</h4>
      <div class="market-info">${item.description}</div>
      <div class="market-value" style="margin-top: 10px;">€ 0.00</div>
      <div class="market-change positive" style="margin-top: 5px;"><i class="fas fa-caret-up"></i> +0.0%</div>
      <button class="tool-button" style="margin-top: 10px; width: 100%;">
        <i class="fas fa-plus"></i> Aggiungi al portafoglio
      </button>
    </div>
  `).join('');
}

function renderPortfolio() {
  document.getElementById('assetList').innerHTML = `
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-chart-line"></i> ETF Mondo</div>
        <div class="asset-meta">Vanguard FTSE All-World</div>
      </div>
      <div>
        <div class="asset-value">€ 9,245.36</div>
        <div class="asset-change positive">+3.2%</div>
      </div>
    </div>
    
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-microchip"></i> Tecnologia</div>
        <div class="asset-meta">Fondo Azionario Globale</div>
      </div>
      <div>
        <div class="asset-value">€ 6,128.50</div>
        <div class="asset-change positive">+7.8%</div>
      </div>
    </div>
    
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-tree"></i> Green Energy</div>
        <div class="asset-meta">ETF Energie Rinnovabili</div>
      </div>
      <div>
        <div class="asset-value">€ 3,245.80</div>
        <div class="asset-change positive">+2.1%</div>
      </div>
    </div>
    
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-gem"></i> Materie Prime</div>
        <div class="asset-meta">Oro e Metalli Preziosi</div>
      </div>
      <div>
        <div class="asset-value">€ 2,542.30</div>
        <div class="asset-change negative">-1.2%</div>
      </div>
    </div>
    
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-home"></i> Immobiliare</div>
        <div class="asset-meta">REIT Globali</div>
      </div>
      <div>
        <div class="asset-value">€ 2,120.40</div>
        <div class="asset-change positive">+0.9%</div>
      </div>
    </div>
    
    <div class="asset-item">
      <div class="asset-info">
        <div class="asset-name"><i class="fas fa-building"></i> Obbligazioni</div>
        <div class="asset-meta">Corporate Bond EUR</div>
      </div>
      <div>
        <div class="asset-value">€ 1,300.00</div>
        <div class="asset-change positive">+0.5%</div>
      </div>
    </div>
  `;
}

// Funzioni per aggiornamento dati in tempo reale
function updateMarketData() {
  document.querySelectorAll('.market-change').forEach(el => {
    // Genera un cambiamento casuale tra -1% e +1.5%
    const change = (Math.random() * 2.5 - 1).toFixed(1);
    const isPositive = change >= 0;
    
    // Aggiorna il valore
    el.textContent = `${isPositive ? '+' : ''}${change}%`;
    el.className = `market-change ${isPositive ? 'positive' : 'negative'}`;
    el.innerHTML = `<i class="fas fa-caret-${isPositive ? 'up' : 'down'}"></i> ${isPositive ? '+' : ''}${change}%`;
    
    // Aggiorna il valore principale
    const card = el.closest('.market-card');
    const valueEl = card.querySelector('.market-value');
    let currentValue = parseFloat(valueEl.textContent.replace(/[^\d.]/g, ''));
    if (valueEl.textContent.includes('$')) {
      currentValue = parseFloat(currentValue);
      const newValue = currentValue * (1 + change/100);
      valueEl.textContent = `$${newValue.toFixed(2)}`;
    } else if (valueEl.textContent.includes('€')) {
      currentValue = parseFloat(currentValue);
      const newValue = currentValue * (1 + change/100);
      valueEl.textContent = `€${newValue.toFixed(2)}`;
    } else {
      currentValue = parseFloat(currentValue);
      const newValue = currentValue * (1 + change/100);
      valueEl.textContent = newValue.toFixed(4);
    }
  });
}

function updatePortfolio() {
  const portfolioValue = document.getElementById('portfolioTotal');
  let currentValue = parseFloat(portfolioValue.textContent.replace(/[^\d.]/g, ''));
  
  // Genera un cambiamento casuale tra -0.5% e +1%
  const change = (Math.random() * 1.5 - 0.5);
  const newValue = currentValue * (1 + change/100);
  
  portfolioValue.textContent = `€ ${newValue.toFixed(2)}`;
  
  const changeEl = document.getElementById('portfolioChange');
  const gain = (newValue - 18245).toFixed(2);
  const percentage = ((newValue / 18245 - 1) * 100).toFixed(1);
  
  changeEl.innerHTML = `<i class="fas fa-caret-${change >= 0 ? 'up' : 'down'}"></i> 
    +€ ${gain} (+${percentage}%) ultimi 30 giorni`;
  changeEl.className = `market-change ${change >= 0 ? 'positive' : 'negative'}`;
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  // Elementi DOM
  const sidebar = document.getElementById('sidebar');
  const openSidebarButtons = document.querySelectorAll('[id^="openSidebar"]');
  const closeSidebar = document.getElementById('closeSidebar');
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen');
  const authModal = document.getElementById('authModal');
  const loginBtn = document.getElementById('loginBtn');
  const biometricBtn = document.getElementById('biometricBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const pinInput = document.getElementById('pinInput');
  const searchInput = document.getElementById('searchInput');
  const exportDataTool = document.getElementById('exportDataTool');
  const importDataTool = document.getElementById('importDataTool');
  
  // Inizializza DB
  try {
    await initDB();
  } catch (e) {
    console.error("Errore inizializzazione DB:", e);
  }
  
  // Setup biometria
  const biometricSupported = await setupBiometrics();
  if (!biometricSupported) {
    biometricBtn.style.display = 'none';
  }
  
  // Verifica autenticazione
  if (!isLoggedIn()) {
    authModal.style.display = 'flex';
  }
  
  // Gestione login
  loginBtn.addEventListener('click', async () => {
    const pin = pinInput.value;
    if (pin.length < 4) {
      showError('loginError', 'Il PIN deve essere di almeno 4 cifre');
      return;
    }
    
    const loggedIn = await login(pin);
    if (loggedIn) {
      authModal.style.display = 'none';
    } else {
      showError('loginError', 'PIN errato');
    }
  });
  
  // Gestione biometria
  biometricBtn.addEventListener('click', async () => {
    const authenticated = await authenticateWithBiometrics();
    if (authenticated) {
      authModal.style.display = 'none';
    } else {
      showError('loginError', 'Autenticazione biometrica fallita');
    }
  });
  
  // Annulla login
  cancelBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
  });
  
  // Gestione sidebar
  openSidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.add('active');
    });
  });
  
  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });
  
  // Chiudi sidebar quando si clicca fuori
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !Array.from(openSidebarButtons).some(btn => btn.contains(e.target))) {
      sidebar.classList.remove('active');
    }
  });
  
  // Gestione navigazione
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Rimuovi classe active da tutti
      navItems.forEach(nav => nav.classList.remove('active'));
      screens.forEach(screen => screen.classList.remove('active'));
      
      // Aggiungi classe active all'elemento cliccato
      item.classList.add('active');
      
      // Mostra la schermata corrispondente
      const screenId = item.dataset.screen;
      document.getElementById(screenId).classList.add('active');
    });
  });
  
  // Gestione ricerca mercato
  searchInput.addEventListener('input', (e) => {
    searchMarket(e.target.value);
  });
  
  // Export/Import dati
  exportDataTool.addEventListener('click', exportData);
  importDataTool.addEventListener('click', () => {
    // Simulazione selezione file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        importData(e.target.files[0]);
      }
    };
    input.click();
  });
  
  // Render dati iniziali
  renderMarketGrid();
  renderPortfolio();
  
  // Simulazione dati di mercato in tempo reale
  setInterval(() => {
    updateMarketData();
    updatePortfolio();
  }, 10000);
});
