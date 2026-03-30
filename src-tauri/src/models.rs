use serde::{Deserialize, Serialize};


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Revenue {
    pub id: Option<i64>,
    #[serde(rename = "type")]
    pub tipo: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
    pub recurring_source_id: Option<i64>,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: Option<i64>,
    pub main_type: String,
    pub subcategory: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
    pub recurring_source_id: Option<i64>,
    pub total_installments: Option<i64>,
    pub installment_number: Option<i64>,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Investment {
    pub id: Option<i64>,
    pub main_type: String,
    pub category: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
    pub recurring_source_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: u32,
    pub total_pages: u32,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct RevenuePayload {
    #[serde(rename = "type")]
    pub tipo: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpensePayload {
    pub main_type: String,
    pub subcategory: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
    pub total_installments: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestmentPayload {
    pub main_type: String,
    pub category: String,
    pub amount: f64,
    pub date_iso: String,
    pub recurring: i64,
}