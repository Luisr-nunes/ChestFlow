use rusqlite::{Connection, Result, params};
use std::sync::Mutex;
use chrono::{NaiveDate, Datelike};

use crate::models::*;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS revenues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            date_iso TEXT NOT NULL,
            recurring INTEGER DEFAULT 0,
            recurring_source_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            main_type TEXT NOT NULL,
            subcategory TEXT NOT NULL,
            amount REAL NOT NULL,
            date_iso TEXT NOT NULL,
            recurring INTEGER DEFAULT 0,
            recurring_source_id INTEGER,
            total_installments INTEGER,
            installment_number INTEGER
        );
        CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            main_type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date_iso TEXT NOT NULL,
            recurring INTEGER DEFAULT 0,
            recurring_source_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS config_global (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recurring_deletions (
            source_id INTEGER NOT NULL,
            deleted_for_month TEXT NOT NULL,
            PRIMARY KEY (source_id, deleted_for_month)
        );
    ")?;

    
    for sql in &[
        "ALTER TABLE revenues ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE expenses ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE investments ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE expenses ADD COLUMN total_installments INTEGER",
        "ALTER TABLE expenses ADD COLUMN installment_number INTEGER",
    ] {
        let _ = conn.execute(sql, []);
    }

    Ok(conn)
}



pub fn last_valid_day(year: i32, month: u32, day: u32) -> NaiveDate {
    let (next_year, next_month) = if month == 12 { (year + 1, 1) } else { (year, month + 1) };
    let first_next = NaiveDate::from_ymd_opt(next_year, next_month, 1).unwrap();
    let last = first_next.pred_opt().unwrap();
    NaiveDate::from_ymd_opt(year, month, day.min(last.day())).unwrap_or(last)
}

fn parse_date(date_iso: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(date_iso, "%Y-%m-%d").ok()
}



pub fn generate_recurring(conn: &Connection, year: i32, month: u32) -> Result<()> {
    let month_str = format!("{:02}", month);
    let year_str = format!("{}", year);

    
    let sources: Vec<(i64, String)> = {
        let mut stmt = conn.prepare("SELECT id, date_iso FROM revenues WHERE recurring = 1")?;
        let x = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .filter_map(|r| r.ok()).collect();
        x
    };
    for (id, date_iso) in sources {
        let Some(src_date) = parse_date(&date_iso) else { continue };
        if year < src_date.year() || (year == src_date.year() && month <= src_date.month()) { continue; }
        let exists: bool = conn.query_row(
            "SELECT 1 FROM revenues WHERE recurring_source_id=?1 AND strftime('%Y',date_iso)=?2 AND strftime('%m',date_iso)=?3",
            params![id, year_str, month_str], |_| Ok(true)
        ).unwrap_or(false);
        if exists { continue; }
        let new_date = last_valid_day(year, month, src_date.day());
        
        let row = conn.query_row("SELECT type, amount, recurring FROM revenues WHERE id=?1", params![id], |r| {
            Ok((r.get::<_,String>(0)?, r.get::<_,f64>(1)?, r.get::<_,i64>(2)?))
        })?;
        conn.execute(
            "INSERT INTO revenues (type, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,0,?4)",
            params![row.0, row.1, new_date.format("%Y-%m-%d").to_string(), id],
        )?;
    }

    
    let sources: Vec<(i64, String)> = {
        let mut stmt = conn.prepare("SELECT id, date_iso FROM expenses WHERE recurring = 1")?;
        let x = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .filter_map(|r| r.ok()).collect();
        x
    };
    for (id, date_iso) in sources {
        let Some(src_date) = parse_date(&date_iso) else { continue };
        if year < src_date.year() || (year == src_date.year() && month <= src_date.month()) { continue; }
        let exists: bool = conn.query_row(
            "SELECT 1 FROM expenses WHERE recurring_source_id=?1 AND strftime('%Y',date_iso)=?2 AND strftime('%m',date_iso)=?3",
            params![id, year_str, month_str], |_| Ok(true)
        ).unwrap_or(false);
        if exists { continue; }
        let new_date = last_valid_day(year, month, src_date.day());
        let row = conn.query_row("SELECT main_type, subcategory, amount FROM expenses WHERE id=?1", params![id], |r| {
            Ok((r.get::<_,String>(0)?, r.get::<_,String>(1)?, r.get::<_,f64>(2)?))
        })?;
        conn.execute(
            "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,?4,0,?5)",
            params![row.0, row.1, row.2, new_date.format("%Y-%m-%d").to_string(), id],
        )?;
    }

    
    let sources: Vec<(i64, String)> = {
        let mut stmt = conn.prepare("SELECT id, date_iso FROM investments WHERE recurring = 1")?;
        let x = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .filter_map(|r| r.ok()).collect();
        x
    };
    for (id, date_iso) in sources {
        let Some(src_date) = parse_date(&date_iso) else { continue };
        if year < src_date.year() || (year == src_date.year() && month <= src_date.month()) { continue; }
        let exists: bool = conn.query_row(
            "SELECT 1 FROM investments WHERE recurring_source_id=?1 AND strftime('%Y',date_iso)=?2 AND strftime('%m',date_iso)=?3",
            params![id, year_str, month_str], |_| Ok(true)
        ).unwrap_or(false);
        if exists { continue; }
        let new_date = last_valid_day(year, month, src_date.day());
        let row = conn.query_row("SELECT main_type, category, amount FROM investments WHERE id=?1", params![id], |r| {
            Ok((r.get::<_,String>(0)?, r.get::<_,String>(1)?, r.get::<_,f64>(2)?))
        })?;
        conn.execute(
            "INSERT INTO investments (main_type, category, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,?4,0,?5)",
            params![row.0, row.1, row.2, new_date.format("%Y-%m-%d").to_string(), id],
        )?;
    }

    Ok(())
}



pub fn get_category_total_db(conn: &Connection, month: u32, year: i32, subcategory: String) -> Result<f64> {
    let m = format!("{:02}", month);
    let y = format!("{}", year);
    let total: f64 = conn.query_row(
        "SELECT SUM(amount) FROM expenses WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2 AND subcategory=?3",
        params![m, y, subcategory],
        |r| Ok(r.get(0).unwrap_or(0.0))
    ).unwrap_or(0.0);
    Ok(total)
}

pub fn list_revenues_db(conn: &Connection, month: u32, year: i32, page: u32, page_size: u32) -> Result<PaginatedResponse<Revenue>> {
    let m = format!("{:02}", month);
    let y = format!("{}", year);
    let offset = (page - 1) * page_size;

    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM revenues WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2",
        params![m, y], |r| r.get(0)
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, type, amount, date_iso, recurring, recurring_source_id FROM revenues 
         WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2 
         ORDER BY date_iso DESC, id DESC LIMIT ?3 OFFSET ?4"
    )?;
    let data = stmt.query_map(params![m, y, page_size, offset], |r| Ok(Revenue {
        id: r.get(0)?, tipo: r.get(1)?, amount: r.get(2)?,
        date_iso: r.get(3)?, recurring: r.get(4)?, recurring_source_id: r.get(5)?,
    }))?.filter_map(|r| r.ok()).collect();

    let total_pages = (total as f64 / page_size as f64).ceil() as u32;

    Ok(PaginatedResponse { data, total, page, total_pages })
}

pub fn list_expenses_db(conn: &Connection, month: u32, year: i32, page: u32, page_size: u32) -> Result<PaginatedResponse<Expense>> {
    let m = format!("{:02}", month);
    let y = format!("{}", year);
    let offset = (page - 1) * page_size;

    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM expenses WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2",
        params![m, y], |r| r.get(0)
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, main_type, subcategory, amount, date_iso, recurring, recurring_source_id, total_installments, installment_number 
         FROM expenses 
         WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2 
         ORDER BY date_iso DESC, id DESC LIMIT ?3 OFFSET ?4"
    )?;
    let data = stmt.query_map(params![m, y, page_size, offset], |r| Ok(Expense {
        id: r.get(0)?, main_type: r.get(1)?, subcategory: r.get(2)?,
        amount: r.get(3)?, date_iso: r.get(4)?, recurring: r.get(5)?, 
        recurring_source_id: r.get(6)?, total_installments: r.get(7)?, installment_number: r.get(8)?,
    }))?.filter_map(|r| r.ok()).collect();

    let total_pages = (total as f64 / page_size as f64).ceil() as u32;

    Ok(PaginatedResponse { data, total, page, total_pages })
}

pub fn list_investments_db(conn: &Connection, month: u32, year: i32, page: u32, page_size: u32) -> Result<PaginatedResponse<Investment>> {
    let m = format!("{:02}", month);
    let y = format!("{}", year);
    let offset = (page - 1) * page_size;

    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM investments WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2",
        params![m, y], |r| r.get(0)
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, main_type, category, amount, date_iso, recurring, recurring_source_id FROM investments 
         WHERE strftime('%m',date_iso)=?1 AND strftime('%Y',date_iso)=?2 
         ORDER BY date_iso DESC, id DESC LIMIT ?3 OFFSET ?4"
    )?;
    let data = stmt.query_map(params![m, y, page_size, offset], |r| Ok(Investment {
        id: r.get(0)?, main_type: r.get(1)?, category: r.get(2)?,
        amount: r.get(3)?, date_iso: r.get(4)?, recurring: r.get(5)?, recurring_source_id: r.get(6)?,
    }))?.filter_map(|r| r.ok()).collect();

    let total_pages = (total as f64 / page_size as f64).ceil() as u32;

    Ok(PaginatedResponse { data, total, page, total_pages })
}