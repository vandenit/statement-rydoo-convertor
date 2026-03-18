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

### Running the Bot as a Background Service
Once you've confirmed the bot successfully processes emails, you can start it as a background daemon. This allows you to safely close your SSH connection or terminal.

1.  **Start the bot**:
    ```bash
    npm run bot:start
    ```
    *The bot now runs safely in the background. Activity logs are saved in `bot.log`.*

2.  **Stop the bot**:
    ```bash
    npm run bot:stop
    ```
    *This command reads the saved `bot.pid` file to gracefully shut down the background service.*

---

## ✅ 3. Per-File Validation

For complete peace of mind, the tool verifies all calculations. The return email displays whether the mathematical sum of all extracted transactions perfectly matches the "Total Balance" listed on that specific PDF. If any discrepancies (mismatches) are found, please review the generated Excel file manually for potential reading errors.

---

*Good luck automating your expense processing!*
