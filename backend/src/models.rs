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

#[derive(Debug, Serialize, Deserialize)]
pub struct PeriodParams {
    pub month: u32,
    pub year: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListParams {
    pub month: u32,
    pub year: i32,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteParams {
    pub id: i64,
    pub mode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigGetParams {
    pub key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigSetParams {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRevenueParams {
    pub id: i64,
    pub payload: RevenuePayload,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateExpenseParams {
    pub id: i64,
    pub payload: ExpensePayload,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInvestmentParams {
    pub id: i64,
    pub payload: InvestmentPayload,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryTotalParams {
    pub month: u32,
    pub year: i32,
    pub subcategory: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YearParams {
    pub year: i32,
}