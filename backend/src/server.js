const { WebSocketServer } = require("ws");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Conexão com o banco de dados MariaDB
const db = mysql.createConnection({
    host: process.env.DB_HOST || "10.1.1.184",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "chat"
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MariaDB:", err);
        return;
    }
    console.log("Conectado ao MariaDB.");
});

// Criar tabela se não existir
db.query(`
    CREATE TABLE IF NOT EXISTS mensagens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conteudo TEXT NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Erro ao criar tabela:", err);
});

// Criar servidor WebSocket
const wss = new WebSocketServer({ port: process.env.PORT || 8080, host: '0.0.0.0' });

wss.on("connection", (ws) => {
    console.log("Cliente conectado");

    // Enviar mensagens antigas para o cliente ao conectar
    db.query("SELECT conteudo FROM mensagens ORDER BY data ASC", (err, results) => {
        if (!err) {
            results.forEach((row) => ws.send(row.conteudo));
        } else {
            console.error("Erro ao recuperar mensagens:", err);
        }
    });

    // Receber e armazenar mensagens
    ws.on("message", (data) => {
        const message = data.toString();

        // Salvar mensagem no banco
        db.query("INSERT INTO mensagens (conteudo) VALUES (?)", [message], (err) => {
            if (err) console.error("Erro ao salvar mensagem:", err);
        });

        // Enviar mensagem para todos os clientes conectados
        wss.clients.forEach((client) => client.send(message));
    });

    ws.on("error", console.error);
});
