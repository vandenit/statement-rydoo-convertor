# Gebruikershandleiding: Statement Convertor (E-mail Bot)

Welkom bij de **Statement Convertor**. Deze tool is ontworpen om PDF-uittreksels van BNP Paribas Fortis snel en foutloos om te zetten naar een Excel-bestand dat direct geïmporteerd kan worden in Rydoo.

Deze tool draait als een geautomatiseerde **e-mail bot**, waardoor je zelf absoluut geen software of `.exe` bestanden hoeft te installeren op je (beveiligde) werk-laptop.

---

## 🚀 1. Hoe gebruik ik de E-mail Bot?

Stuur simpelweg een e-mail met één of meerdere PDF-uittreksels (of een `.zip` bestand met PDF's) naar het ingestelde e-mailadres (bijv. `statements@vandenit.be`).

1. De bot controleert de mailbox elke minuut.
2. Nieuwe PDF's worden razendsnel lokaal gedownload en omgezet.
3. De originele inkomende mail wordt netjes verplaatst naar de map `statements_processed` op de e-mailserver om dubbel werk te voorkomen.
4. Je ontvangt vrijwel direct een antwoord e-mail (via Postmark) met daarin een handige samenvatting (totalen per document) én het verwerkte Rydoo Excel-bestand als bijlage!

---

## 🛠️ 2. Zelf de Bot hosten (Voor Beheerders)

Wil je de bot zelf draaien op een server of VPS? Volg deze stappen:

### Installatie / Configuratie
1. Kloon deze repository en draai `npm install`.
2. Vul je IMAP- en bestemmingsgegevens in het `config.yaml` bestand in.
3. Zet je wachtwoorden en API-sleutels (zoals `POSTMARK_API_KEY` en `EMAIL_PASSWORD`) in een lokale `.env` file (gebruik de `.env.example` of documentatie in de repo als leidraad).
4. Test of de connecties werken door de bot eenmalig te starten via:
    ```bash
    npm run bot
    ```

### De bot permanent (als service) draaien
Zodra je zeker weet dat de bot succesvol mails oppakt, kun je hem als background-daemon starten. Zo kun je je SSH-connectie of terminal sluiten.

1.  **Start de bot**:
    ```bash
    npm run bot:start
    ```
    *De bot draait nu veilig op de achtergrond. De logs worden opgeslagen in `bot.log`.*

2.  **Stop de bot**:
    ```bash
    npm run bot:stop
    ```
    *Dit commando leest het opgeslagen `bot.pid` bestand en sluit de background service netjes (gracefully) af.*

---

## ✅ 3. Validatie per bestand

De tool controleert voor de zekerheid het totaalbedrag. Per verwerkte PDF toont de e-mail of de transacties wiskundig kloppen met het PDF "Totaalsaldo". Als er mismatches zijn, controleer het Excel-bestand dan handmatig op eventuele leesfouten.

---

*Veel succes met het automatiseren van je onkostenverwerking!*
