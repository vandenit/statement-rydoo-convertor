# User Guide: Statement Convertor (Email Bot)

Welcome to the **Statement Convertor**. This tool is designed to quickly and flawlessly convert BNP Paribas Fortis and bpost bank PDF statements into an Excel file that can be immediately imported into Rydoo.

This tool runs as a centralized **Email Bot**, completely eliminating the need to manually install any software on your corporate laptop.

---

## 🚀 1. How to use the Email Bot?

Simply send an email containing one or more PDF statements (or a `.zip` archive containing PDFs) to the bot's email address (e.g., `statements@vandenit.be`).

1. The bot monitors the mailbox every minute.
2. Your new PDFs are instantly downloaded and converted behind the scenes.
3. The original incoming email is moved to a `statements_processed` folder on the mail server to prevent duplicate processing.
4. Within about a minute, you will receive an **automated reply via email** containing a detailed summary (totals per document) along with your processed Rydoo Excel file attached!

### Example Input
*   **Recipient**: `statements@vandenit.be`
*   **Subject**: "Expenses February" *(The subject doesn't actually matter!)*
*   **Attachment**: `Statement_Feb.pdf` or `All_Statements.zip`

---

## ✅ 2. Per-File Validation & Verification

For complete peace of mind, the bot verifies all calculations it performs. 

The return email displays whether the mathematical sum of all extracted transactions perfectly matches the **"Total Balance"** listed on that specific PDF document. 

*   ✅ **Match**: The values match mathematically.
*   ⚠️ **Mismatch**: If any discrepancies are found, the email will notify you. Please review the generated Excel file manually for potential reading/parsing errors on that specific PDF.

---

*Good luck automating your expense processing!*
