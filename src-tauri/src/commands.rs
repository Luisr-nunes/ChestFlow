use tauri::State;
use rusqlite::params;
use crate::db::*;
use crate::models::*;
use chrono::{NaiveDate, Datelike};

type Db<'a> = State<'a, DbState>;
type R<T> = Result<T, String>;
fn e(err: impl std::fmt::Display) -> String { err.to_string() }



#[tauri::command]
pub fn generate_recurring(db: Db, month: u32, year: i32) -> R<()> {
    let conn = db.inner().0.lock().map_err(e)?;
    crate::db::generate_recurring(&conn, year, month).map_err(e)
}



#[tauri::command]
pub fn list_revenues(db: Db, month: u32, year: i32, page: Option<u32>, page_size: Option<u32>) -> R<PaginatedResponse<Revenue>> {
    let conn = db.inner().0.lock().map_err(e)?;
    crate::db::generate_recurring(&conn, year, month).map_err(e)?;
    list_revenues_db(&conn, month, year, page.unwrap_or(1), page_size.unwrap_or(20)).map_err(e)
}

#[tauri::command]
pub fn add_revenue(db: Db, payload: RevenuePayload) -> R<i64> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "INSERT INTO revenues (type, amount, date_iso, recurring) VALUES (?1,?2,?3,?4)",
        params![payload.tipo, payload.amount, payload.date_iso, payload.recurring],
    ).map_err(e)?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_revenue(db: Db, id: i64, payload: RevenuePayload) -> R<()> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "UPDATE revenues SET type=?1, amount=?2, date_iso=?3, recurring=?4 WHERE id=?5",
        params![payload.tipo, payload.amount, payload.date_iso, payload.recurring, id],
    ).map_err(e)?;
    Ok(())
}

#[tauri::command]
pub fn delete_revenue(db: Db, id: i64, mode: String) -> R<()> {
    let conn = db.inner().0.lock().map_err(e)?;
    let recurring: i64 = conn.query_row(
        "SELECT recurring FROM revenues WHERE id=?1", params![id], |r| r.get(0)
    ).unwrap_or(0);

    if mode == "all" && recurring == 1 {
        conn.execute("DELETE FROM revenues WHERE recurring_source_id=?1", params![id]).map_err(e)?;
    }
    conn.execute("DELETE FROM revenues WHERE id=?1", params![id]).map_err(e)?;
    Ok(())
}



#[tauri::command]
pub fn list_expenses(db: Db, month: u32, year: i32, page: Option<u32>, page_size: Option<u32>) -> R<PaginatedResponse<Expense>> {
    let conn = db.inner().0.lock().map_err(e)?;
    crate::db::generate_recurring(&conn, year, month).map_err(e)?;
    list_expenses_db(&conn, month, year, page.unwrap_or(1), page_size.unwrap_or(20)).map_err(e)
}

#[tauri::command]
pub fn get_category_total(db: Db, month: u32, year: i32, subcategory: String) -> R<f64> {
    let conn = db.inner().0.lock().map_err(e)?;
    get_category_total_db(&conn, month, year, subcategory).map_err(e)
}

#[tauri::command]
pub fn add_expense(db: Db, payload: ExpensePayload) -> R<i64> {
    let conn = db.0.lock().map_err(e)?;
    let total_inst = payload.total_installments.unwrap_or(1);

    if total_inst > 1 {
        let base_date = NaiveDate::parse_from_str(&payload.date_iso, "%Y-%m-%d").map_err(e)?;
        let amount_per_inst = payload.amount / (total_inst as f64);

        for i in 1..=total_inst {
            let mut month = base_date.month() + (i as u32) - 1;
            let mut year = base_date.year();
            while month > 12 { month -= 12; year += 1; }
            
            let inst_date = crate::db::last_valid_day(year, month, base_date.day());
            conn.execute(
                "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring, total_installments, installment_number) VALUES (?1,?2,?3,?4,0,?5,?6)",
                params![payload.main_type, payload.subcategory, amount_per_inst, inst_date.format("%Y-%m-%d").to_string(), total_inst, i],
            ).map_err(e)?;
        }
        Ok(0)
    } else {
        conn.execute(
            "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring) VALUES (?1,?2,?3,?4,?5)",
            params![payload.main_type, payload.subcategory, payload.amount, payload.date_iso, payload.recurring],
        ).map_err(e)?;
        Ok(conn.last_insert_rowid())
    }
}

#[tauri::command]
pub fn update_expense(db: Db, id: i64, payload: ExpensePayload) -> R<()> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "UPDATE expenses SET main_type=?1, subcategory=?2, amount=?3, date_iso=?4, recurring=?5 WHERE id=?6",
        params![payload.main_type, payload.subcategory, payload.amount, payload.date_iso, payload.recurring, id],
    ).map_err(e)?;
    Ok(())
}

#[tauri::command]
pub fn delete_expense(db: Db, id: i64, mode: String) -> R<()> {
    let conn = db.inner().0.lock().map_err(e)?;
    let recurring: i64 = conn.query_row(
        "SELECT recurring FROM expenses WHERE id=?1", params![id], |r| r.get(0)
    ).unwrap_or(0);

    if mode == "all" && recurring == 1 {
        conn.execute("DELETE FROM expenses WHERE recurring_source_id=?1", params![id]).map_err(e)?;
    }
    conn.execute("DELETE FROM expenses WHERE id=?1", params![id]).map_err(e)?;
    Ok(())
}



#[tauri::command]
pub fn list_investments(db: Db, month: u32, year: i32, page: Option<u32>, page_size: Option<u32>) -> R<PaginatedResponse<Investment>> {
    let conn = db.inner().0.lock().map_err(e)?;
    crate::db::generate_recurring(&conn, year, month).map_err(e)?;
    list_investments_db(&conn, month, year, page.unwrap_or(1), page_size.unwrap_or(20)).map_err(e)
}

#[tauri::command]
pub fn add_investment(db: Db, payload: InvestmentPayload) -> R<i64> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "INSERT INTO investments (main_type, category, amount, date_iso, recurring) VALUES (?1,?2,?3,?4,?5)",
        params![payload.main_type, payload.category, payload.amount, payload.date_iso, payload.recurring],
    ).map_err(e)?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_investment(db: Db, id: i64, payload: InvestmentPayload) -> R<()> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "UPDATE investments SET main_type=?1, category=?2, amount=?3, date_iso=?4, recurring=?5 WHERE id=?6",
        params![payload.main_type, payload.category, payload.amount, payload.date_iso, payload.recurring, id],
    ).map_err(e)?;
    Ok(())
}

#[tauri::command]
pub fn delete_investment(db: Db, id: i64, mode: String) -> R<()> {
    let conn = db.inner().0.lock().map_err(e)?;
    let recurring: i64 = conn.query_row(
        "SELECT recurring FROM investments WHERE id=?1", params![id], |r| r.get(0)
    ).unwrap_or(0);

    if mode == "all" && recurring == 1 {
        conn.execute("DELETE FROM investments WHERE recurring_source_id=?1", params![id]).map_err(e)?;
    }
    conn.execute("DELETE FROM investments WHERE id=?1", params![id]).map_err(e)?;
    Ok(())
}



#[derive(serde::Serialize)]
pub struct MonthHistory {
    pub mes: u32,
    pub receita: f64,
    pub despesa: f64,
}

#[tauri::command]
pub fn get_annual_history(db: Db, year: i32) -> R<Vec<MonthHistory>> {
    let conn = db.inner().0.lock().map_err(e)?;
    let y = format!("{}", year);
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

    let mut stmt = conn.prepare(sql).map_err(e)?;
    let rows = {
        let mapped = stmt.query_map(params![y], |r| Ok(MonthHistory {
            mes: r.get(0)?, receita: r.get(1)?, despesa: r.get(2)?,
        })).map_err(e)?;
        mapped.filter_map(|r| r.ok()).collect()
    };
    Ok(rows)
}



#[tauri::command]
pub fn get_config(db: Db, key: String) -> R<Option<String>> {
    let conn = db.inner().0.lock().map_err(e)?;
    let val = conn.query_row(
        "SELECT value FROM config_global WHERE key=?1", params![key], |r| r.get(0)
    ).ok();
    Ok(val)
}

#[tauri::command]
pub fn set_config(db: Db, key: String, value: String) -> R<()> {
    let conn = db.0.lock().map_err(e)?;
    conn.execute(
        "INSERT INTO config_global (key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![key, value],
    ).map_err(e)?;
    Ok(())
}