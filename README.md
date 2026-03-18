# Statement Convertor Bot

A Node.js Email Bot that automatically extracts transactions from structural PDF bank statements (currently supporting BNP Paribas Fortis and bpost bank) and converts them into an Excel format ready for immediate import into Rydoo.

## 🚀 The Email Bot Service
Instead of running local desktop software, this project serves as a standalone **Background Bot** that monitors a designated inbox. No local installation on employee laptops is required.

### Features
*   **Automatic IMAP Fetching**: Polls an inbox every minute for emails containing `.pdf` or `.zip` files.
*   **Intelligent Extraction**: Safely unzips archives and parses the PDF text.
*   **Mathematical Verification**: Validates the extracted transaction totals against the "Total Balance" listed on the statement.
*   **Smart Moving**: Automatically moves processed emails from the inbox to a `statements_processed` folder on the mail server.
*   **Postmark SMTP Delivery**: Automatically generates the final Excel file and emails it directly back to the sender via Postmark using a Handlebars HTML template summary.

## 🛠️ Installation (Server Admin)

1.  Clone this repository.
2.  Install dependencies: `npm install`
3.  Configure your IMAP inbox structure in `config.yaml`.
4.  Configure your sensitive credentials in `.env` (e.g., `EMAIL_PASSWORD`, `POSTMARK_API_KEY`).
5.  Test the bot manually:
    ```bash
    npm run bot
    ```

### Running as a Systemd Service (Recommended)
To ensure the bot starts automatically on server reboot and restarts if it crashes, you should deploy it as a systemd service. 

1. Create a `statement-bot.service` file in the project root:
    ```ini
    [Unit]
    Description=Statement Convertor Email Bot
    After=network.target

    [Service]
    Type=simple
    User=your_username
    WorkingDirectory=/path/to/project
    ExecStart=/usr/bin/npm run bot
    Restart=on-failure
    RestartSec=10

    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=statement-bot

    [Install]
    WantedBy=multi-user.target
    ```
2. Enable and start the service:
    ```bash
    sudo cp statement-bot.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now statement-bot.service
    ```
    *(Use `sudo journalctl -u statement-bot -f` to view live logs)*

## 👥 Usage (End Users)
End users simply send an email containing their PDF statement(s) to the bot's configured email address. Within a minute, they will receive an automated reply with the converted Excel file attached. See `USERGUIDE.md` for more details.

## 🛠 Technology Stack
*   **Node.js** & **TypeScript**
*   **imap-simple** for polling
*   **postmark** for structured email delivery
*   **exceljs** for `.xlsx` generation
*   **pdf-parse** (bundled) for parsing PDFs
