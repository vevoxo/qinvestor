// main.js - Qinvest Pro Trading Platform Logic

// Trading Engine Class
class TradingEngine {
    constructor() {
        this.activeOrders = [];
        this.positions = [];
        this.balance = 10000; // Starting balance
        this.currentSymbol = 'BTC/USD';
        this.currentPrice = 42856.34;
        this.orderIdCounter = 1;
    }

    // Place market order
    placeMarketOrder(amount, side) {
        if (amount <= 0 || !amount) {
            this.showNotification('Invalid amount', 'error');
            return;
        }

        const slippage = this.calculateSlippage(amount, side);
        const executionPrice = this.calculateExecutionPrice(amount, side, slippage);
        const totalCost = amount * executionPrice;

        // Check balance
        if (totalCost > this.balance) {
            this.showNotification('Insufficient funds', 'error');
            return;
        }

        // Create order object
        const order = {
            id: this.generateOrderId(),
            type: 'market',
            symbol: this.currentSymbol,
            amount,
            side,
            price: executionPrice,
            slippage: slippage.toFixed(2),
            total: totalCost.toFixed(2),
            timestamp: Date.now(),
            status: 'filled'
        };

        // Update balance
        this.balance -= totalCost;

        // Add to active orders
        this.activeOrders.push(order);

        // Create position
        this.createPosition(order);

        // Update UI
        this.updateUI();
        this.showNotification(`Order executed at $${executionPrice.toFixed(2)}`, 'success');
    }

    // Calculate slippage based on order size
    calculateSlippage(amount, side) {
        const basePrice = this.currentPrice;
        const volumeFactor = amount / 10; // Assuming $10 average trade volume
        const slippagePercent = Math.min(volumeFactor * 0.1, 1); // Max 1% slippage
        return slippagePercent;
    }

    // Calculate execution price with slippage
    calculateExecutionPrice(amount, side, slippage) {
        const basePrice = this.currentPrice;
        return side.toLowerCase() === 'buy' 
            ? basePrice * (1 + slippage/100) 
            : basePrice * (1 - slippage/100);
    }

    // Create position from order
    createPosition(order) {
        const existingPosition = this.positions.find(p => 
            p.symbol === order.symbol && p.side === order.side
        );

        if (existingPosition) {
            // Average position
            existingPosition.size += order.amount;
            existingPosition.entryPrice = (
                (existingPosition.entryPrice * existingPosition.size) + 
                (order.price * order.amount)
            ) / (existingPosition.size + order.amount);
        } else {
            // New position
            this.positions.push({
                id: `POS-${order.id}`,
                symbol: order.symbol,
                side: order.side,
                size: order.amount,
                entryPrice: order.price,
                currentPrice: this.currentPrice,
                timestamp: order.timestamp
            });
        }
    }

    // Generate unique order ID
    generateOrderId() {
        return `ORD-${Date.now()}-${this.orderIdCounter++}`;
    }

    // Update all UI components
    updateUI() {
        this.updateBalanceDisplay();
        this.updatePositionsTable();
        this.updateOrdersTable();
    }

    // Update balance display
    updateBalanceDisplay() {
        document.querySelectorAll('[data-balance]').forEach(el => {
            el.textContent = `$${this.balance.toFixed(2)}`;
        });

        document.querySelectorAll('[data-equity]').forEach(el => {
            const equity = this.calculateEquity();
            el.textContent = `$${equity.toFixed(2)}`;
        });
    }

    // Calculate total equity
    calculateEquity() {
        const unrealizedPnL = this.positions.reduce((sum, pos) => {
            return sum + ((this.currentPrice - pos.entryPrice) * pos.size);
        }, 0);
        
        return this.balance + unrealizedPnL;
    }

    // Update positions table
    updatePositionsTable() {
        const container = document.getElementById('positions-table');
        if (!container) return;

        container.innerHTML = this.positions.map(position => {
            const pnl = (this.currentPrice - position.entryPrice) * position.size;
            const pnlPercent = ((pnl / (position.entryPrice * position.size)) * 100).toFixed(2);
            
            return `
                <tr class="hover:bg-gray-700/50">
                    <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center">
                            <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" class="h-6 w-6 mr-2">
                            <span>${position.symbol}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">${position.size.toFixed(4)} BTC</td>
                    <td class="px-4 py-3 whitespace-nowrap">$${position.entryPrice.toFixed(2)}</td>
                    <td class="px-4 py-3 whitespace-nowrap">$${this.currentPrice.toFixed(2)}</td>
                    <td class="px-4 py-3 whitespace-nowrap ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}">
                        ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent}%)
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <div class="w-full bg-gray-600 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${Math.min(Math.abs(pnlPercent), 100)}%"></div>
                        </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm" onclick="closePosition('${position.id}')">
                            Close
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Update orders table
    updateOrdersTable() {
        const container = document.getElementById('orders-table');
        if (!container) return;

        container.innerHTML = this.activeOrders.slice(-5).map(order => {
            return `
                <tr class="hover:bg-gray-700/50">
                    <td class="px-4 py-3 whitespace-nowrap">${order.id}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${order.symbol}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${order.side.toUpperCase()}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${order.amount.toFixed(4)}</td>
                    <td class="px-4 py-3 whitespace-nowrap">$${order.price.toFixed(2)}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${order.slippage}%</td>
                    <td class="px-4 py-3 whitespace-nowrap">$${order.total}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${new Date(order.timestamp).toLocaleTimeString()}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-1 bg-green-600/30 text-green-400 rounded">${order.status}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 
            ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Update market data displays
    updateMarketData() {
        // Update main price display
        document.querySelectorAll('.price-up, .price-down').forEach(el => {
            el.classList.remove('price-up', 'price-down');
            void el.offsetWidth; // Force reflow
            el.textContent = `$${this.currentPrice.toFixed(2)}`;
            el.classList.add(this.currentPrice > this.previousPrice ? 'price-up' : 'price-down');
        });

        // Update market overview
        document.querySelectorAll('[data-market-price]').forEach(el => {
            el.textContent = `$${this.currentPrice.toFixed(2)}`;
            const percentEl = el.nextElementSibling;
            if (percentEl) {
                const change = ((this.currentPrice - this.previousPrice) / this.previousPrice) * 100;
                percentEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                percentEl.className = change > 0 
                    ? 'text-green-400 text-sm' 
                    : 'text-red-400 text-sm';
            }
        });

        this.previousPrice = this.currentPrice;
    }

    // Simulate price movement
    startPriceSimulation() {
        setInterval(() => {
            const changePercent = (Math.random() * 2 - 1) * 0.5;
            this.currentPrice *= (1 + changePercent / 100);
            this.updateMarketData();
        }, 5000);
    }
}

// Initialize trading engine
const tradingEngine = new TradingEngine();

// Close position function
window.closePosition = function(positionId) {
    const position = tradingEngine.positions.find(p => p.id === positionId);
    if (!position) return;

    // Calculate profit/loss
    const pnl = (tradingEngine.currentPrice - position.entryPrice) * position.size;
    tradingEngine.balance += position.size * tradingEngine.currentPrice;
    
    // Remove position
    tradingEngine.positions = tradingEngine.positions.filter(p => p.id !== positionId);
    
    // Update UI
    tradingEngine.updateUI();
    
    // Show notification
    tradingEngine.showNotification(
        `Position closed with P/L: $${pnl.toFixed(2)}`, 
        pnl >= 0 ? 'success' : 'error'
    );
};

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize TradingView widgets
    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "autosize": true,
            "symbol": "BINANCE:BTCUSDT",
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#1a1a2e",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tradingview-chart"
        });

        new TradingView.widget({
            "width": "100%",
            "height": 400,
            "symbol": "CRYPTOCAP:BTC",
            "locale": "en",
            "colorTheme": "dark",
            "isTransparent": false,
            "newsSentiment": true,
            "container_id": "tradingview-news"
        });
    }

    // Setup buttons
    setupButtons();

    // Start price simulation
    tradingEngine.startPriceSimulation();
    tradingEngine.updateUI();

    console.log('Qinvest Pro Trading Platform v1.0 initialized');
});

// Button event listeners
function setupButtons() {
    // Desktop Buy/Sell buttons
    document.querySelectorAll('.quick-trade-buy').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('quick-trade-amount')?.value || 0);
            tradingEngine.placeMarketOrder(amount, 'buy');
        });
    });

    document.querySelectorAll('.quick-trade-sell').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('quick-trade-amount')?.value || 0);
            tradingEngine.placeMarketOrder(amount, 'sell');
        });
    });

    // Mobile Buy/Sell buttons
    document.querySelectorAll('.mobile-trade-buy').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('mobile-trade-amount')?.value || 0);
            tradingEngine.placeMarketOrder(amount, 'buy');
        });
    });

    document.querySelectorAll('.mobile-trade-sell').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('mobile-trade-amount')?.value || 0);
            tradingEngine.placeMarketOrder(amount, 'sell');
        });
    });

    // Percentage buttons
    document.querySelectorAll('.percentage-btn').forEach(button => {
        button.addEventListener('click', () => {
            const percentage = parseFloat(button.textContent) / 100;
            const maxAmount = tradingEngine.balance / tradingEngine.currentPrice;
            const amount = maxAmount * percentage;
            document.getElementById('quick-trade-amount').value = amount.toFixed(4);
            document.getElementById('mobile-trade-amount').value = amount.toFixed(4);
        });
    });

    // Modal handlers
    const depositModal = document.getElementById('deposit-modal');
    const loginModal = document.getElementById('login-modal');

    // Show deposit modal
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent.trim() === 'Deposit') {
            button.addEventListener('click', () => {
                depositModal.classList.remove('hidden');
                depositModal.classList.add('flex');
            });
        }
    });

    // Close modals
    document.getElementById('close-deposit-modal')?.addEventListener('click', () => {
        depositModal.classList.add('hidden');
        depositModal.classList.remove('flex');
    });

    document.getElementById('close-login-modal')?.addEventListener('click', () => {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
    });

    // Price animation
    function simulatePriceChange() {
        const priceElements = document.querySelectorAll('.price-up, .price-down');
        priceElements.forEach(el => {
            el.classList.remove('price-up', 'price-down');
            void el.offsetWidth; // Trigger reflow
            const isUp = Math.random() > 0.5;
            if (isUp) {
                el.classList.add('price-up');
            } else {
                el.classList.add('price-down');
            }
        });
        setTimeout(simulatePriceChange, 5000);
    }

    // Start price simulation
    setTimeout(simulatePriceChange, 5000);

    // Mobile menu toggle
    document.querySelector('.md\\:hidden button')?.addEventListener('click', () => {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.classList.toggle('hidden');
            nav.classList.toggle('flex');
            nav.classList.toggle('flex-col');
            nav.classList.toggle('absolute');
            nav.classList.toggle('top-16');
            nav.classList.toggle('left-0');
            nav.classList.toggle('right-0');
            nav.classList.toggle('bg-gray-800');
            nav.classList.toggle('p-4');
            nav.classList.toggle('space-y-4');
        }
    });
}
// Global variables
let tvWidget = null;
const availableAssets = [
  { name: 'BTC/USD', symbol: 'BINANCE:BTCUSDT' },
  { name: 'ETH/USD', symbol: 'BINANCE:ETHUSDT' },
  { name: 'BNB/USD', symbol: 'BINANCE:BNBUSDT' },
  { name: 'SOL/USD', symbol: 'BINANCE:SOLUSDT' },
  { name: 'XRP/USD', symbol: 'BINANCE:XRPUSDT' },
  { name: 'ADA/USD', symbol: 'BINANCE:ADAUSDT' },
  { name: 'DOGE/USD', symbol: 'BINANCE:DOGEUSDT' },
  { name: 'SHIB/USD', symbol: 'BINANCE:SHIBUSDT' }
];

let selectedAsset = availableAssets[0]; // Default

// Initialize TradingView Chart
function initTradingView(symbol) {
  if (tvWidget) {
    tvWidget.remove(); // Destroy previous chart
  }

  tvWidget = new TradingView.widget({
    "autosize": true,
    "symbol": symbol,
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "en",
    "toolbar_bg": "#1a1a2e",
    "enable_publishing": false,
    "hide_top_toolbar": false,
    "allow_symbol_change": false,
    "container_id": "tradingview-chart"
  });
}

// Open asset modal
document.querySelector('[data-market-price]')?.addEventListener('click', () => {
  document.getElementById('asset-modal').classList.remove('hidden');
  document.getElementById('asset-modal').classList.add('flex');
  populateAssetList();
  document.getElementById('asset-search').value = '';
});

// Close asset modal
document.getElementById('close-asset-modal')?.addEventListener('click', () => {
  document.getElementById('asset-modal').classList.add('hidden');
  document.getElementById('asset-modal').classList.remove('flex');
});

// Filter asset list
document.getElementById('asset-search')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = availableAssets.filter(asset =>
    asset.name.toLowerCase().includes(query)
  );
  renderAssetList(filtered);
});

// Populate asset list
function populateAssetList() {
  renderAssetList(availableAssets);
}

function renderAssetList(assets) {
  const container = document.getElementById('asset-list');
  if (!container) return;

  container.innerHTML = assets.map(asset => `
    <div class="asset-item cursor-pointer hover:bg-gray-700 p-3 rounded-lg transition" data-symbol="${asset.symbol}" data-name="${asset.name}">
      <div class="flex justify-between items-center">
        <span>${asset.name}</span>
        <span class="text-sm text-gray-400">${asset.symbol}</span>
      </div>
    </div>
  `).join('');

  // Add click handler for asset selection
  document.querySelectorAll('.asset-item').forEach(item => {
    item.addEventListener('click', () => {
      const symbol = item.getAttribute('data-symbol');
      const name = item.getAttribute('data-name');
      selectedAsset = { name, symbol };
      document.getElementById('asset-modal').classList.add('hidden');
      document.getElementById('asset-modal').classList.remove('flex');
      updateAssetDisplay(name, symbol);
    });
  });
}

// Update DOM elements when asset changes
function updateAssetDisplay(name, symbol) {
  // Update price display
  const priceEl = document.querySelector('[data-market-price]');
  if (priceEl) {
    priceEl.textContent = `$${getSimulatedPrice(symbol).toFixed(2)}`;
    updatePriceChange(priceEl.nextElementSibling, symbol);
  }

  // Update title
  const titleEl = document.querySelector('[data-asset-title]');
  if (titleEl) {
    titleEl.textContent = name;
  }

  // Update TradingView chart
  initTradingView(symbol);
}

// Simulate price change for demo purposes
function getSimulatedPrice(symbol) {
  const basePrices = {
    'BINANCE:BTCUSDT': 42856.34,
    'BINANCE:ETHUSDT': 2456.78,
    'BINANCE:BNBUSDT': 312.45,
    'BINANCE:SOLUSDT': 87.23,
    'BINANCE:XRPUSDT': 0.5423,
    'BINANCE:ADAUSDT': 0.32,
    'BINANCE:DOGEUSDT': 0.078,
    'BINANCE:SHIBUSDT': 0.0000098
  };
  return basePrices[symbol] || 0;
}

// Update price change percentage
function updatePriceChange(el, symbol) {
  const changes = {
    'BINANCE:BTCUSDT': '+2.45%',
    'BINANCE:ETHUSDT': '+1.87%',
    'BINANCE:BNBUSDT': '-0.56%',
    'BINANCE:SOLUSDT': '-3.21%',
    'BINANCE:XRPUSDT': '+0.78%',
    'BINANCE:ADAUSDT': '+1.23%',
    'BINANCE:DOGEUSDT': '-1.12%',
    'BINANCE:SHIBUSDT': '+2.13%'
  };

  const change = changes[symbol] || '+0.00%';
  el.textContent = change;
  el.className = change.startsWith('+') ? 'text-green-400 text-sm' : 'text-red-400 text-sm';
}