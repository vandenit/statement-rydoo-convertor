# User Guide: Statement Convertor (Email Bot)

Welcome to the **Statement Convertor**. This tool is designed to quickly and flawlessly convert BNP Paribas Fortis PDF bank statements into an Excel file that can be immediately imported into Rydoo.

This tool runs as an automated **Email Bot**, completely eliminating the need to install any software or `.exe` files on your (secured) corporate laptop.

---

## 🚀 1. How to use the Email Bot?

Simply send an email containing one or more PDF statements (or a `.zip` archive containing PDFs) to the configured email address (e.g., `statements@vandenit.be`).

1. The bot monitors the mailbox every minute.
2. New PDFs are instantly downloaded and converted locally by the server.
3. The original incoming email is moved to a `statements_processed` folder on the mail server to prevent duplicate processing.
4. You will almost immediately receive an automated reply via email (powered by Postmark) containing a detailed summary (totals per document) along with your processed Rydoo Excel file attached!

---

## 🛠️ 2. Hosting the Bot (For Administrators)

Do you want to run the bot on your own server or VPS? Follow these steps:

### Installation & Configuration
1. Clone this repository and run `npm install`.
2. Enter your IMAP and destination details in the `config.yaml` file.
3. Place your sensitive passwords and API keys (such as `POSTMARK_API_KEY` and `EMAIL_PASSWORD`) in a local `.env` file (use `.env.example` or the repository documentation as a guide).
4. Verify the connections by starting the bot once manually:
    ```bash
    npm run bot
    ```

### Running the Bot via Systemd (Recommended)
To ensure the bot runs professionally in the background and automatically restarts on server reboots or crashes, we use **systemd**:

1. Ensure the `statement-bot.service` file in the project root is updated with your correct paths and Linux username.
2. Run the following commands on your server:
    ```bash
    sudo cp statement-bot.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now statement-bot.service
    ```

The service is now fully managed in the background.
*   **View live logs**: `sudo journalctl -u statement-bot -f`
*   **Start bot**: `sudo systemctl start statement-bot`
*   **Stop bot**: `sudo systemctl stop statement-bot`

---

## ✅ 3. Per-File Validation

For complete peace of mind, the tool verifies all calculations. The return email displays whether the mathematical sum of all extracted transactions perfectly matches the "Total Balance" listed on that specific PDF. If any discrepancies (mismatches) are found, please review the generated Excel file manually for potential reading errors.

---

*Good luck automating your expense processing!*
