use rusqlite::{Connection, Result, params};
use chrono::{NaiveDate, Datelike};

use crate::models::*;

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
            record_type TEXT DEFAULT '',
            PRIMARY KEY (source_id, record_type, deleted_for_month)
        );
    ")?;

    for sql in &[
        "ALTER TABLE revenues ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE expenses ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE investments ADD COLUMN recurring_source_id INTEGER",
        "ALTER TABLE expenses ADD COLUMN total_installments INTEGER",
        "ALTER TABLE expenses ADD COLUMN installment_number INTEGER",
        "ALTER TABLE recurring_deletions ADD COLUMN record_type TEXT DEFAULT ''",
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

pub fn generate_recurring(conn: &Connection, year: i32, _month: u32) -> Result<()> {
    // Modificado para gerar até o fim do ano de (year + 3) em vez de parar no mês atual
    // Isso garante que despesas, receitas e investimentos projetem um futuro "infinito"
    let target_date = NaiveDate::from_ymd_opt(year + 3, 12, 31).unwrap();
    println!(">>> Iniciando processamento de recorrências até 12/{}", year + 3);

    // 1. REVENUES
    let mut stmt_rev = conn.prepare("SELECT id, type, amount, date_iso FROM revenues WHERE recurring = 1")?;
    let sources_rev: Vec<(i64, String, f64, String)> = stmt_rev.query_map([], |r| 
        Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
    )?.filter_map(|r| r.ok()).collect();

    for (src_id, r_type, amount, src_date_str) in sources_rev {
        let Some(src_date) = parse_date(&src_date_str) else { continue };
        
        let mut curr_month = src_date.month() + 1;
        let mut curr_year = src_date.year();
        if curr_month > 12 { curr_month = 1; curr_year += 1; }

        while NaiveDate::from_ymd_opt(curr_year, curr_month, 1).unwrap() <= target_date {
            let month_key = format!("{}-{:02}", curr_year, curr_month);
            
            let exists: bool = conn.query_row(
                "SELECT 1 FROM revenues WHERE recurring_source_id=?1 AND date_iso LIKE ?2",
                params![src_id, format!("{}%", month_key)], |_| Ok(true)
            ).unwrap_or(false);

            if !exists {
                let is_deleted: bool = conn.query_row(
                    "SELECT 1 FROM recurring_deletions WHERE source_id=?1 AND record_type='revenue' AND deleted_for_month=?2",
                    params![src_id, month_key], |_| Ok(true)
                ).unwrap_or(false);

                if !is_deleted {
                    let new_date = last_valid_day(curr_year, curr_month, src_date.day());
                    conn.execute(
                        "INSERT INTO revenues (type, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,0,?4)",
                        params![r_type, amount, new_date.format("%Y-%m-%d").to_string(), src_id],
                    )?;
                    println!("  + Receita gerada: {} para {}", r_type, month_key);
                }
            }
            curr_month += 1;
            if curr_month > 12 { curr_month = 1; curr_year += 1; }
        }
    }

    // 2. EXPENSES
    let mut stmt_exp = conn.prepare("SELECT id, main_type, subcategory, amount, date_iso FROM expenses WHERE recurring = 1")?;
    let sources_exp: Vec<(i64, String, String, f64, String)> = stmt_exp.query_map([], |r| 
        Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?))
    )?.filter_map(|r| r.ok()).collect();

    for (src_id, main_type, subcat, amount, src_date_str) in sources_exp {
        let Some(src_date) = parse_date(&src_date_str) else { continue };
        
        let mut curr_month = src_date.month() + 1;
        let mut curr_year = src_date.year();
        if curr_month > 12 { curr_month = 1; curr_year += 1; }

        while NaiveDate::from_ymd_opt(curr_year, curr_month, 1).unwrap() <= target_date {
            let month_key = format!("{}-{:02}", curr_year, curr_month);
            
            let exists: bool = conn.query_row(
                "SELECT 1 FROM expenses WHERE recurring_source_id=?1 AND date_iso LIKE ?2",
                params![src_id, format!("{}%", month_key)], |_| Ok(true)
            ).unwrap_or(false);

            if !exists {
                let is_deleted: bool = conn.query_row(
                    "SELECT 1 FROM recurring_deletions WHERE source_id=?1 AND record_type='expense' AND deleted_for_month=?2",
                    params![src_id, month_key], |_| Ok(true)
                ).unwrap_or(false);

                if !is_deleted {
                    let new_date = last_valid_day(curr_year, curr_month, src_date.day());
                    conn.execute(
                        "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,?4,0,?5)",
                        params![main_type, subcat, amount, new_date.format("%Y-%m-%d").to_string(), src_id],
                    )?;
                    println!("  + Despesa gerada: {} para {}", subcat, month_key);
                }
            }
            curr_month += 1;
            if curr_month > 12 { curr_month = 1; curr_year += 1; }
        }
    }

    // 3. INVESTMENTS
    let mut stmt_inv = conn.prepare("SELECT id, main_type, category, amount, date_iso FROM investments WHERE recurring = 1")?;
    let sources_inv: Vec<(i64, String, String, f64, String)> = stmt_inv.query_map([], |r| 
        Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?))
    )?.filter_map(|r| r.ok()).collect();

    for (src_id, main_type, cat, amount, src_date_str) in sources_inv {
        let Some(src_date) = parse_date(&src_date_str) else { continue };
        
        let mut curr_month = src_date.month() + 1;
        let mut curr_year = src_date.year();
        if curr_month > 12 { curr_month = 1; curr_year += 1; }

        while NaiveDate::from_ymd_opt(curr_year, curr_month, 1).unwrap() <= target_date {
            let month_key = format!("{}-{:02}", curr_year, curr_month);
            
            let exists: bool = conn.query_row(
                "SELECT 1 FROM investments WHERE recurring_source_id=?1 AND date_iso LIKE ?2",
                params![src_id, format!("{}%", month_key)], |_| Ok(true)
            ).unwrap_or(false);

            if !exists {
                let is_deleted: bool = conn.query_row(
                    "SELECT 1 FROM recurring_deletions WHERE source_id=?1 AND record_type='investment' AND deleted_for_month=?2",
                    params![src_id, month_key], |_| Ok(true)
                ).unwrap_or(false);

                if !is_deleted {
                    let new_date = last_valid_day(curr_year, curr_month, src_date.day());
                    conn.execute(
                        "INSERT INTO investments (main_type, category, amount, date_iso, recurring, recurring_source_id) VALUES (?1,?2,?3,?4,0,?5)",
                        params![main_type, cat, amount, new_date.format("%Y-%m-%d").to_string(), src_id],
                    )?;
                    println!("  + Investimento gerado: {} para {}", cat, month_key);
                }
            }
            curr_month += 1;
            if curr_month > 12 { curr_month = 1; curr_year += 1; }
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::{Connection, params};

    #[test]
    fn test_recurrence_generation() -> Result<()> {
        let conn = Connection::open_in_memory()?;
        init_db_from_conn(&conn)?;

        // 1. Criar uma despesa recorrente em Abril/2026
        conn.execute(
            "INSERT INTO expenses (main_type, subcategory, amount, date_iso, recurring) VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["Fixa", "Aluguel", 1500.0, "2026-04-10", 1],
        )?;

        // 2. Gerar recorrências para Maio/2026
        generate_recurring(&conn, 2026, 5)?;

        // 3. Verificar se a despesa foi criada para Maio
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM expenses WHERE date_iso = '2026-05-10' AND recurring_source_id IS NOT NULL",
            [],
            |r| r.get(0),
        )?;

        assert_eq!(count, 1, "Deveria ter gerado 1 despesa recorrente para Maio");

        // 4. Tentar gerar novamente para o mesmo mês (não deve duplicar)
        generate_recurring(&conn, 2026, 5)?;
        let count_again: i64 = conn.query_row(
            "SELECT COUNT(*) FROM expenses WHERE date_iso = '2026-05-10'",
            [],
            |r| r.get(0),
        )?;
        assert_eq!(count_again, 1, "Não deveria duplicar a recorrência no mesmo mês");

        Ok(())
    }

    fn init_db_from_conn(conn: &Connection) -> Result<()> {
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
                record_type TEXT DEFAULT '',
                PRIMARY KEY (source_id, record_type, deleted_for_month)
            );
        ")?;
        Ok(())
    }
}