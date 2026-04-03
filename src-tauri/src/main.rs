mod db;
mod models;
mod commands;

use axum::{
    routing::{get, post},
    Router,
    Extension,
};
use db::init_db;
use std::sync::{Arc, Mutex};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use chrono::Datelike; // Importação necessária para .year() e .month()

#[tokio::main]
async fn main() {
    // Inicializa logs
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Configuração do diretório de dados (compatível com Windows)
    let app_data_dir = std::env::var("APPDATA").expect("Falha ao obter diretório APPDATA");
    let data_dir = std::path::Path::new(&app_data_dir).join("com.chestflow.app");
    std::fs::create_dir_all(&data_dir).expect("Falha ao criar diretório de dados");

    let db_path = data_dir.join("controle_pessoal.db");
    let conn = init_db(db_path.to_str().unwrap()).expect("Falha ao inicializar banco de dados");
    
    let shared_state = Arc::new(Mutex::new(conn));

    // Gera recorrências para o mês atual em segundo plano (Otimizado)
    let state_clone = Arc::clone(&shared_state);
    tokio::spawn(async move {
        let now = chrono::Local::now();
        if let Ok(conn_lock) = state_clone.lock() {
            let _ = crate::db::generate_recurring(&conn_lock, now.year(), now.month());
            println!("Recorrências processadas em background.");
        }
    });

    // Configuração do CORS para permitir chamadas do Electron
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Rotas da API
    let app = Router::new()
        // Config
        .route("/get_config", post(commands::get_config_http))
        .route("/set_config", post(commands::set_config_http))
        // Revenues
        .route("/list_revenues", post(commands::list_revenues_http))
        .route("/add_revenue", post(commands::add_revenue_http))
        .route("/update_revenue", post(commands::update_revenue_http))
        .route("/delete_revenue", post(commands::delete_revenue_http))
        // Expenses
        .route("/list_expenses", post(commands::list_expenses_http))
        .route("/add_expense", post(commands::add_expense_http))
        .route("/update_expense", post(commands::update_expense_http))
        .route("/delete_expense", post(commands::delete_expense_http))
        .route("/get_category_total", post(commands::get_category_total_http))
        // Investments
        .route("/list_investments", post(commands::list_investments_http))
        .route("/add_investment", post(commands::add_investment_http))
        .route("/update_investment", post(commands::update_investment_http))
        .route("/delete_investment", post(commands::delete_investment_http))
        // Reports
        .route("/get_annual_history", post(commands::get_annual_history_http))
        .route("/generate_recurring", post(commands::generate_recurring_http))
        .layer(cors)
        .layer(Extension(shared_state));

    // Tenta rodar na porta 5181 (ou deixa o sistema escolher uma livre)
    let port = 5181;
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    
    println!("RUST_SERVER_PORT:{}", port); // Electron vai ler isso
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
