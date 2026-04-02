use axum::{Json, Extension, response::IntoResponse, http::StatusCode};
use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};
use crate::db::*;
use crate::models::*;
use chrono::{NaiveDate, Datelike};

type Db = Extension<Arc<Mutex<Connection>>>;

// Estruturas para receber o payload do frontend
#[derive(Debug, serde::Deserialize)]
pub struct WrappedRevenue { pub payload: RevenuePayload }
#[derive(Debug, serde::Deserialize)]
pub struct WrappedExpense { pub payload: ExpensePayload }
#[derive(Debug, serde::Deserialize)]
pub struct WrappedInvestment { pub payload: InvestmentPayload }

// Helper para converter erros de banco de dados em respostas HTTP 500
fn db_error(err: impl std::fmt::Display) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

pub async fn generate_recurring_http(db: Db, Json(params): Json<PeriodParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    crate::db::generate_recurring(&conn, params.year, params.month).map_err(db_error)?;
    Ok(Json(()))
}

pub async fn list_revenues_http(db: Db, Json(params): Json<ListParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let res = list_revenues_db(&conn, params.month, params.year, params.page.unwrap_or(1), params.page_size.unwrap_or(20)).map_err(db_error)?;
    Ok(Json(res))
}

pub async fn add_revenue_http(db: Db, Json(wrapped): Json<WrappedRevenue>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = wrapped.payload;
    conn.execute(
        "INSERT INTO revenues (type, amount, date_iso, recurring) VALUES (?1,?2,?3,?4)",
        params![payload.tipo, payload.amount, payload.date_iso, payload.recurring],
    ).map_err(db_error)?;
    Ok(Json(conn.last_insert_rowid()))
}

pub async fn update_revenue_http(db: Db, Json(params): Json<UpdateRevenueParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = params.payload;
    conn.execute(
        "UPDATE revenues SET type=?1, amount=?2, date_iso=?3, recurring=?4 WHERE id=?5",
        params![payload.tipo, payload.amount, payload.date_iso, payload.recurring, params.id],
    ).map_err(db_error)?;
    Ok(Json(()))
}

pub async fn delete_revenue_http(db: Db, Json(params): Json<DeleteParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let id = params.id;
    let mode = params.mode;

    // Busca informações da recorrência antes de deletar
    let info: (i64, Option<i64>, String) = conn.query_row(
        "SELECT recurring, recurring_source_id, date_iso FROM revenues WHERE id=?1", 
        params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
    ).map_err(db_error)?;

    if mode == "all" {
        let source_id = if info.0 == 1 { id } else { info.1.unwrap_or(id) };
        conn.execute("DELETE FROM revenues WHERE id=?1 OR recurring_source_id=?1", params![source_id]).map_err(db_error)?;
    } else {
        if info.0 == 0 && info.1.is_some() {
            let month_key = &info.2[0..7];
            conn.execute(
                "INSERT OR IGNORE INTO recurring_deletions (source_id, deleted_for_month) VALUES (?1, ?2)",
                params![info.1, month_key]
            ).map_err(db_error)?;
        }
        conn.execute("DELETE FROM revenues WHERE id=?1", params![id]).map_err(db_error)?;
    }
    Ok(Json(()))
}

pub async fn list_expenses_http(db: Db, Json(params): Json<ListParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let res = list_expenses_db(&conn, params.month, params.year, params.page.unwrap_or(1), params.page_size.unwrap_or(20)).map_err(db_error)?;
    Ok(Json(res))
}

pub async fn get_category_total_http(db: Db, Json(params): Json<CategoryTotalParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let res = get_category_total_db(&conn, params.month, params.year, params.subcategory).map_err(db_error)?;
    Ok(Json(res))
}

pub async fn add_expense_http(db: Db, Json(wrapped): Json<WrappedExpense>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = wrapped.payload;
    let total_inst = payload.total_installments.unwrap_or(1);

    if total_inst > 1 {
        let base_date = NaiveDate::parse_from_str(&payload.date_iso, "%Y-%m-%d").map_err(db_error)?;
        let amount_per_inst = payload.amount / (total_inst as f64);

        for i in 1..=total_inst {
            let mut month = base_date.month() + (i as u32) - 1;
            let mut year = base_date.year();
            while month > 12 { month -= 12; year += 1; }
            
            let inst_date = crate::db::last_valid_day(year, month, base_date.day());
            conn.execute(
                "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring, total_installments, installment_number) VALUES (?1,?2,?3,?4,0,?5,?6)",
                params![payload.main_type, payload.subcategory, amount_per_inst, inst_date.format("%Y-%m-%d").to_string(), total_inst, i],
            ).map_err(db_error)?;
        }
        Ok(Json(0i64))
    } else {
        conn.execute(
            "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring) VALUES (?1,?2,?3,?4,?5)",
            params![payload.main_type, payload.subcategory, payload.amount, payload.date_iso, payload.recurring],
        ).map_err(db_error)?;
        Ok(Json(conn.last_insert_rowid()))
    }
}

pub async fn update_expense_http(db: Db, Json(params): Json<UpdateExpenseParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = params.payload;
    conn.execute(
        "UPDATE expenses SET main_type=?1, subcategory=?2, amount=?3, date_iso=?4, recurring=?5 WHERE id=?6",
        params![payload.main_type, payload.subcategory, payload.amount, payload.date_iso, payload.recurring, params.id],
    ).map_err(db_error)?;
    Ok(Json(()))
}

pub async fn delete_expense_http(db: Db, Json(params): Json<DeleteParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let id = params.id;
    let mode = params.mode;

    // Busca informações da recorrência antes de deletar
    let info: (i64, Option<i64>, String) = conn.query_row(
        "SELECT recurring, recurring_source_id, date_iso FROM expenses WHERE id=?1", 
        params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
    ).map_err(db_error)?;

    if mode == "all" {
        let source_id = if info.0 == 1 { id } else { info.1.unwrap_or(id) };
        conn.execute("DELETE FROM expenses WHERE id=?1 OR recurring_source_id=?1", params![source_id]).map_err(db_error)?;
    } else {
        if info.0 == 0 && info.1.is_some() {
            let month_key = &info.2[0..7];
            conn.execute(
                "INSERT OR IGNORE INTO recurring_deletions (source_id, deleted_for_month) VALUES (?1, ?2)",
                params![info.1, month_key]
            ).map_err(db_error)?;
        }
        conn.execute("DELETE FROM expenses WHERE id=?1", params![id]).map_err(db_error)?;
    }
    Ok(Json(()))
}

pub async fn list_investments_http(db: Db, Json(params): Json<ListParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let res = list_investments_db(&conn, params.month, params.year, params.page.unwrap_or(1), params.page_size.unwrap_or(20)).map_err(db_error)?;
    Ok(Json(res))
}

pub async fn add_investment_http(db: Db, Json(wrapped): Json<WrappedInvestment>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = wrapped.payload;
    conn.execute(
        "INSERT INTO investments (main_type, category, amount, date_iso, recurring) VALUES (?1,?2,?3,?4,?5)",
        params![payload.main_type, payload.category, payload.amount, payload.date_iso, payload.recurring],
    ).map_err(db_error)?;
    Ok(Json(conn.last_insert_rowid()))
}

pub async fn update_investment_http(db: Db, Json(params): Json<UpdateInvestmentParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let payload = params.payload;
    conn.execute(
        "UPDATE investments SET main_type=?1, category=?2, amount=?3, date_iso=?4, recurring=?5 WHERE id=?6",
        params![payload.main_type, payload.category, payload.amount, payload.date_iso, payload.recurring, params.id],
    ).map_err(db_error)?;
    Ok(Json(()))
}

pub async fn delete_investment_http(db: Db, Json(params): Json<DeleteParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let id = params.id;
    let mode = params.mode;

    // Busca informações da recorrência antes de deletar
    let info: (i64, Option<i64>, String) = conn.query_row(
        "SELECT recurring, recurring_source_id, date_iso FROM investments WHERE id=?1", 
        params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
    ).map_err(db_error)?;

    if mode == "all" {
        let source_id = if info.0 == 1 { id } else { info.1.unwrap_or(id) };
        conn.execute("DELETE FROM investments WHERE id=?1 OR recurring_source_id=?1", params![source_id]).map_err(db_error)?;
    } else {
        if info.0 == 0 && info.1.is_some() {
            let month_key = &info.2[0..7];
            conn.execute(
                "INSERT OR IGNORE INTO recurring_deletions (source_id, deleted_for_month) VALUES (?1, ?2)",
                params![info.1, month_key]
            ).map_err(db_error)?;
        }
        conn.execute("DELETE FROM investments WHERE id=?1", params![id]).map_err(db_error)?;
    }
    Ok(Json(()))
}

#[derive(serde::Serialize)]
pub struct MonthHistory {
    pub mes: u32,
    pub receita: f64,
    pub despesa: f64,
}

pub async fn get_annual_history_http(db: Db, Json(params): Json<YearParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let y = format!("{}", params.year);
    let sql = "
        SELECT m.mes,
            COALESCE(r.total,0),
            (COALESCE(d.total,0) + COALESCE(i.total,0))
        FROM (
            SELECT 1 mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
            UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) m
        LEFT JOIN (SELECT CAST(strftime('%m',date_iso) AS INTEGER) mes, SUM(amount) total FROM revenues WHERE strftime('%Y',date_iso)=?1 GROUP BY 1) r ON m.mes=r.mes
        LEFT JOIN (SELECT CAST(strftime('%m',date_iso) AS INTEGER) mes, SUM(amount) total FROM expenses WHERE strftime('%Y',date_iso)=?1 GROUP BY 1) d ON m.mes=d.mes
        LEFT JOIN (SELECT CAST(strftime('%m',date_iso) AS INTEGER) mes, SUM(amount) total FROM investments WHERE strftime('%Y',date_iso)=?1 GROUP BY 1) i ON m.mes=i.mes
        ORDER BY m.mes";

    let mut stmt = conn.prepare(sql).map_err(db_error)?;
    let rows: Vec<MonthHistory> = {
        let mapped = stmt.query_map(params![y], |r| Ok(MonthHistory {
            mes: r.get(0)?, receita: r.get(1)?, despesa: r.get(2)?,
        })).map_err(db_error)?;
        mapped.filter_map(|r| r.ok()).collect()
    };
    Ok(Json(rows))
}

pub async fn get_config_http(db: Db, Json(params): Json<ConfigGetParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    let val: Option<String> = conn.query_row(
        "SELECT value FROM config_global WHERE key=?1", params![params.key], |r| r.get(0)
    ).ok();
    Ok(Json(val))
}

pub async fn set_config_http(db: Db, Json(params): Json<ConfigSetParams>) -> Result<impl IntoResponse, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Lock do banco envenenado".to_string()))?;
    conn.execute(
        "INSERT INTO config_global (key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![params.key, params.value],
    ).map_err(db_error)?;
    Ok(Json(()))
}
