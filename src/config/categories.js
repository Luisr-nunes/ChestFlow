/**
 * Categories Config — Fonte única de verdade para todas as categorias
 * Qualquer alteração de categorias deve ser feita APENAS aqui
 */

// ─── Categorias de Despesas ─────────────────────────────────
export const EXPENSE_CATEGORIES = {
    'Fixa': [
        'Aluguel', 'Energia', 'Água', 'Internet', 'Condomínio',
        'Faculdade', 'Seguro', 'Plano de Saúde', 'Academia',
        'Anticoncepcional', 'Parcelamento', 'Empréstimo',
        'Feira', 'Streaming', 'Cota Trabalho', 'Outros'
    ],
    'Variavel': [
        'Supermercado', 'Farmácia', 'Restaurante', 'Uber',
        'Combustível', 'Lazer', 'Telefone', 'Padaria',
        'Alimentação Trabalho', 'Cartão de Crédito', 'PIX',
        'Barbeiro', 'Tatuagem', 'Suplementos', 'Medicamentos', 'Outros'
    ],
    'Adicional': [
        'Presente', 'Viagem', 'Reforma', 'Eletrônicos', 'Vestuário',
        'Cinema', 'Bike Itaú', 'Plantas', 'Aquário', 'Perfume',
        'Materiais', 'Livros', 'Outros'
    ]
};

// ─── Categorias de Investimentos ─────────────────────────────
export const INVESTMENT_CATEGORIES = {
    'Renda Fixa': ['CDB', 'Tesouro Direto', 'LCI', 'LCA', 'CRI', 'CRA', 'Debêntures', 'Outros'],
    'Renda Variável': ['Ações', 'FIIs', 'FIA', 'ETFs', 'BDRs', 'Opções', 'Futuros', 'Câmbio', 'Commodities', 'Outros'],
    'Criptomoedas': ['Bitcoin', 'Ethereum', 'Solana', 'USDT', 'Dogecoin', 'Cardano', 'Outros']
};

// ─── Categorias de Receitas ──────────────────────────────────
export const REVENUE_CATEGORIES = [
    'Salário', 'Aluguel', 'Dividendos', 'JCP',
    'Venda de Ativo', 'Freelance', 'Reembolso', 'Presente', 'Outros'
];

// ─── Configuração Visual por Categoria ───────────────────────
export const CATEGORIES_CONFIG = {
    // Habitação / Fixas
    'Habitação': { color: '#04ed67' },
    'Aluguel': { color: '#27ae60' },
    'Energia': { color: '#f1c40f' },
    'Luz': { color: '#f1c40f' },
    'Água': { color: '#3498db' },
    'Internet': { color: '#1abc9c' },
    'Condomínio': { color: '#7f8c8d' },
    'Seguro': { color: '#e74c3c' },
    'Feira': { color: '#2ecc71' },
    'Streaming': { color: '#8e44ad' },
    'Plano de Saúde': { color: '#e74c3c' },
    'Academia': { color: '#e67e22' },
    'Anticoncepcional': { color: '#d63031' },
    'Parcelamento': { color: '#95a5a6' },
    'Empréstimo': { color: '#7f8c8d' },
    'Cota Trabalho': { color: '#34495e' },
    'Faculdade': { color: '#2980b9' },

    // Variável
    'Supermercado': { color: '#e74c3c' },
    'Padaria': { color: '#d35400' },
    'Alimentação Trabalho': { color: '#e67e22' },
    'Restaurante': { color: '#f39c12' },
    'Uber': { color: '#2c3e50' },
    'Combustível': { color: '#c0392b' },
    'Telefone': { color: '#8e44ad' },
    'Barbeiro': { color: '#34495e' },
    'Tatuagem': { color: '#2c3e50' },
    'Cartão de Crédito': { color: '#c0392b' },
    'PIX': { color: '#16a085' },
    'Farmácia': { color: '#e74c3c' },
    'Medicamentos': { color: '#e74c3c' },
    'Suplementos': { color: '#f39c12' },

    // Adicional
    'Lazer': { color: '#9b59b6' },
    'Cinema': { color: '#8e44ad' },
    'Bike Itaú': { color: '#e67e22' },
    'Viagem': { color: '#3498db' },
    'Plantas': { color: '#27ae60' },
    'Aquário': { color: '#1abc9c' },
    'Materiais': { color: '#95a5a6' },
    'Livros': { color: '#8e44ad' },
    'Vestuário': { color: '#e91e63' },
    'Perfume': { color: '#d81b60' },
    'Presente': { color: '#ff7675' },
    'Reforma': { color: '#7f8c8d' },
    'Eletrônicos': { color: '#2980b9' },

    // Meta-categorias
    'Outros': { color: '#bdc3c7' },
    'Fixa': { color: '#006848' },
    'Variavel': { color: '#ffa502' },
    'Adicional': { color: '#ad4ce3' },
    'Renda Fixa': { color: '#27ae60' },
    'Renda Variável': { color: '#f1c40f' }
};

export function getCategoryConfig(categoria) {
    return CATEGORIES_CONFIG[categoria] || { color: '#95a5a6' };
}
