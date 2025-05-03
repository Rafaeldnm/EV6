// Data Storage
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let investments = JSON.parse(localStorage.getItem('investments')) || [];

// DOM Elements
const categoryForm = document.getElementById('category-form');
const investmentForm = document.getElementById('investment-form');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load data for current page
    if (document.getElementById('categories-table')) {
        loadCategories();
    }
    if (document.getElementById('investments-table')) {
        loadInvestments();
    }
    if (document.getElementById('recent-investments')) {
        loadDashboard();
    }
    if (document.getElementById('bar-chart')) {
        initializeCharts();
    }
});

// Category Functions
function loadCategories() {
    const tableBody = document.getElementById('categories-table').querySelector('tbody');
    tableBody.innerHTML = '';

    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${category.name}</td>
            <td class="px-6 py-4">${category.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editCategory('${category.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCategory('${category.id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('category-form');
    
    if (categoryId) {
        title.textContent = 'Editar Categoria';
        const category = categories.find(c => c.id === categoryId);
        document.getElementById('category-id').value = categoryId;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-desc').value = category.description || '';
    } else {
        title.textContent = 'Nova Categoria';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.add('hidden');
}

function saveCategory(e) {
    e.preventDefault();
    
    const id = document.getElementById('category-id').value || generateId();
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-desc').value.trim();
    
    if (!name) {
        alert('Por favor, insira um nome para a categoria');
        return;
    }
    
    const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
    if (existingCategory) {
        alert('Já existe uma categoria com este nome');
        return;
    }
    
    const category = { id, name, description };
    
    if (document.getElementById('category-id').value) {
        // Update existing category
        const index = categories.findIndex(c => c.id === id);
        categories[index] = category;
    } else {
        // Add new category
        categories.push(category);
    }
    
    localStorage.setItem('categories', JSON.stringify(categories));
    closeCategoryModal();
    loadCategories();
    loadDashboard();
}

function editCategory(id) {
    openCategoryModal(id);
}

function deleteCategory(id) {
    if (confirm('Tem certeza que deseja excluir esta categoria? Todos os investimentos relacionados serão removidos.')) {
        // Remove investments for this category
        investments = investments.filter(i => i.categoryId !== id);
        localStorage.setItem('investments', JSON.stringify(investments));
        
        // Remove category
        categories = categories.filter(c => c.id !== id);
        localStorage.setItem('categories', JSON.stringify(categories));
        
        loadCategories();
        loadInvestments();
        loadDashboard();
    }
}

// Investment Functions
function loadInvestments() {
    const tableBody = document.getElementById('investments-table').querySelector('tbody');
    tableBody.innerHTML = '';

    investments.forEach(investment => {
        const category = categories.find(c => c.id === investment.categoryId);
        const row = document.createElement('tr');
        const adjustedValue = calculateIPCAAdjustedValue(investment.amount, investment.year);
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${category ? category.name : 'Categoria removida'}</td>
            <td class="px-6 py-4">${investment.year}</td>
            <td class="px-6 py-4">R$ ${investment.amount.toFixed(2).replace('.', ',')}</td>
            <td class="px-6 py-4">R$ ${adjustedValue.toFixed(2).replace('.', ',')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editInvestment('${investment.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteInvestment('${investment.id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openInvestmentModal(investmentId = null) {
    const modal = document.getElementById('investment-modal');
    const title = document.getElementById('investment-modal-title');
    const form = document.getElementById('investment-form');
    const categorySelect = document.getElementById('investment-category');
    
    // Populate category dropdown
    categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    if (investmentId) {
        title.textContent = 'Editar Investimento';
        const investment = investments.find(i => i.id === investmentId);
        document.getElementById('investment-id').value = investmentId;
        document.getElementById('investment-category').value = investment.categoryId;
        document.getElementById('investment-year').value = investment.year;
        document.getElementById('investment-amount').value = investment.amount;
    } else {
        title.textContent = 'Novo Investimento';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

function closeInvestmentModal() {
    document.getElementById('investment-modal').classList.add('hidden');
}

function saveInvestment(e) {
    e.preventDefault();
    
    const id = document.getElementById('investment-id').value || generateId();
    const categoryId = document.getElementById('investment-category').value;
    const year = parseInt(document.getElementById('investment-year').value);
    const amount = parseFloat(document.getElementById('investment-amount').value);
    
    if (!categoryId || !year || !amount) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    if (year < 2000 || year > 2099) {
        alert('Por favor, insira um ano válido entre 2000 e 2099');
        return;
    }
    
    if (amount <= 0) {
        alert('O valor do investimento deve ser maior que zero');
        return;
    }
    
    // Check for duplicate investment (same category and year)
    const existingInvestment = investments.find(i => 
        i.categoryId === categoryId && 
        i.year === year && 
        i.id !== id
    );
    
    if (existingInvestment) {
        alert('Já existe um investimento registrado para esta categoria e ano');
        return;
    }
    
    const investment = { id, categoryId, year, amount };
    
    if (document.getElementById('investment-id').value) {
        // Update existing investment
        const index = investments.findIndex(i => i.id === id);
        investments[index] = investment;
    } else {
        // Add new investment
        investments.push(investment);
    }
    
    localStorage.setItem('investments', JSON.stringify(investments));
    closeInvestmentModal();
    loadInvestments();
    loadDashboard();
}

function editInvestment(id) {
    openInvestmentModal(id);
}

function deleteInvestment(id) {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
        investments = investments.filter(i => i.id !== id);
        localStorage.setItem('investments', JSON.stringify(investments));
        loadInvestments();
        loadDashboard();
    }
}

// Dashboard Functions
function loadDashboard() {
    // Calculate totals
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const currentYear = new Date().getFullYear();
    const annualInvested = investments
        .filter(i => i.year === currentYear)
        .reduce((sum, i) => sum + i.amount, 0);
    
    // Update summary cards
    document.getElementById('total-invested').textContent = `R$ ${totalInvested.toFixed(2).replace('.', ',')}`;
    document.getElementById('annual-invested').textContent = `R$ ${annualInvested.toFixed(2).replace('.', ',')}`;
    document.getElementById('category-count').textContent = categories.length;
    
    // Load recent investments
    const tableBody = document.getElementById('recent-investments').querySelector('tbody');
    tableBody.innerHTML = '';
    
    const recentInvestments = [...investments]
        .sort((a, b) => b.year - a.year || b.amount - a.amount)
        .slice(0, 5);
    
    recentInvestments.forEach(investment => {
        const category = categories.find(c => c.id === investment.categoryId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2 px-4">${category ? category.name : 'Categoria removida'}</td>
            <td class="py-2 px-4">${investment.year}</td>
            <td class="py-2 px-4">R$ ${investment.amount.toFixed(2).replace('.', ',')}</td>
            <td class="py-2 px-4">R$ ${calculateIPCAAdjustedValue(investment.amount, investment.year).toFixed(2).replace('.', ',')}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Chart Functions
function initializeCharts() {
    // Populate category dropdown
    const categorySelect = document.getElementById('chart-category');
    categorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    // Set default year range
    const currentYear = new Date().getFullYear();
    document.getElementById('chart-year-start').value = currentYear - 5;
    document.getElementById('chart-year-end').value = currentYear;
    
    // Initialize charts
    updateCharts();
}

function updateCharts() {
    const categoryId = document.getElementById('chart-category').value;
    const yearStart = parseInt(document.getElementById('chart-year-start').value);
    const yearEnd = parseInt(document.getElementById('chart-year-end').value);
    
    // Filter investments
    let filteredInvestments = investments.filter(i => 
        i.year >= yearStart && 
        i.year <= yearEnd
    );
    
    if (categoryId !== 'all') {
        filteredInvestments = filteredInvestments.filter(i => i.categoryId === categoryId);
    }
    
    // Update bar chart (investments by year)
    updateBarChart(filteredInvestments, categoryId);
    
    // Update pie chart (distribution by category)
    updatePieChart(filteredInvestments);
}

function updateBarChart(filteredInvestments, categoryId) {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    
    // Group by year
    const years = [...new Set(filteredInvestments.map(i => i.year))].sort();
    const datasets = [];
    
    if (categoryId === 'all') {
        // Show each category as separate dataset
        categories.forEach(category => {
            const data = years.map(year => {
                const investment = filteredInvestments.find(i => 
                    i.categoryId === category.id && 
                    i.year === year
                );
                return investment ? investment.amount : 0;
            });
            
            datasets.push({
                label: category.name,
                data: data,
                backgroundColor: getRandomColor()
            });
        });
    } else {
        // Show single category
        const data = years.map(year => {
            const investment = filteredInvestments.find(i => i.year === year);
            return investment ? investment.amount : 0;
        });
        
        datasets.push({
            label: categories.find(c => c.id === categoryId)?.name || 'Categoria',
            data: data,
            backgroundColor: '#3b82f6'
        });
    }
    
    // Destroy existing chart if it exists
    if (window.barChart) {
        window.barChart.destroy();
    }
    
    window.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Investimento por Ano (R$)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2).replace('.', ',');
                        }
                    }
                }
            }
        }
    });
}

function updatePieChart(filteredInvestments) {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    
    // Group by category
    const categoryTotals = {};
    filteredInvestments.forEach(investment => {
        const categoryName = categories.find(c => c.id === investment.categoryId)?.name || 'Outros';
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + investment.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(() => getRandomColor());
    
    // Destroy existing chart if it exists
    if (window.pieChart) {
        window.pieChart.destroy();
    }
    
    window.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribuição por Categoria (R$)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: R$ ${context.raw.toFixed(2).replace('.', ',')}`;
                        }
                    }
                }
            }
        }
    });
}

function exportChart(chartId) {
    const chart = chartId === 'bar-chart' ? window.barChart : window.pieChart;
    if (!chart) return;
    
    const a = document.createElement('a');
    a.href = chart.toBase64Image();
    a.download = `grafico-${chartId}-${new Date().toISOString().slice(0,10)}.png`;
    a.click();
}

// IPCA Data (example values - should be updated with official data)
const ipcaRates = {
    2020: 0.0425,
    2021: 0.1025,
    2022: 0.0575,
    2023: 0.0479,
    // Add more years as needed
};

// Calculate IPCA adjusted value
function calculateIPCAAdjustedValue(amount, year) {
    const currentYear = new Date().getFullYear();
    let adjusted = amount;
    
    for (let y = year; y < currentYear; y++) {
        if (ipcaRates[y]) {
            adjusted *= (1 + ipcaRates[y]);
        }
    }
    return adjusted;
}

// Helper Functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Event Listeners
if (categoryForm) {
    categoryForm.addEventListener('submit', saveCategory);
}

if (investmentForm) {
    investmentForm.addEventListener('submit', saveInvestment);
}

// Global functions for HTML onclick handlers
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.editInvestment = editInvestment;
window.deleteInvestment = deleteInvestment;
window.updateCharts = updateCharts;
window.exportChart = exportChart;