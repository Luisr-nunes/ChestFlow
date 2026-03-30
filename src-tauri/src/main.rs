mod db;
mod models;
mod commands;

use db::{DbState, init_db};
use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir()
                .expect("Falha ao obter diretório de dados");
            std::fs::create_dir_all(&data_dir)
                .expect("Falha ao criar diretório de dados");

            let db_path = data_dir.join("controle_pessoal.db");
            let conn = init_db(db_path.to_str().unwrap())
                .expect("Falha ao inicializar banco de dados");

            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            
            commands::generate_recurring,
            
            commands::list_revenues,
            commands::add_revenue,
            commands::update_revenue,
            commands::delete_revenue,
            
            commands::list_expenses,
            commands::get_category_total,
            commands::add_expense,
            commands::update_expense,
            commands::delete_expense,
            
            commands::list_investments,
            commands::add_investment,
            commands::update_investment,
            commands::delete_investment,
            
            commands::get_annual_history,
            
            commands::get_config,
            commands::set_config,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar aplicação Tauri");
}

fn main() {
    run();
}