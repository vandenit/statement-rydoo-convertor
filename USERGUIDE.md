# Gebruikershandleiding: Statement Convertor

Welkom bij de **Statement Convertor**. Deze tool is ontworpen om PDF-uittreksels van BNP Paribas Fortis snel en foutloos om te zetten naar een Excel-bestand dat direct geïmporteerd kan worden in Rydoo.

---

## 🚀 1. Waar vind ik de tool?

De laatste versie van de tool is altijd te vinden op de **GitHub Release pagina**:

👉 [Download de laatste versie (v0.9.1)](https://github.com/vandenit/statement-convertor/releases/latest)

Scroll naar beneden naar **Assets** en download het bestand voor jouw systeem:
*   **Windows**: `statement-convertor-win.exe`
*   **macOS**: `statement-convertor-macos` (voor Intel & M1/M2/M3 Macs)

---

## 🛠️ 2. Installatie & Opstarten

### Voor Windows
1.  Download de `.exe` file.
2.  Plaats de file in een eigen map (bijv. op je Bureaublad of in Documenten).
3.  **Belangrijk**: Bij de eerste keer uitvoeren kan Windows een melding geven ("Microsoft Defender SmartScreen"). Klik op **"Meer informatie"** en daarna op **"Toch uitvoeren"**.

### Voor macOS
1.  Download de macOS binary.
2.  Open je **Terminal** (via Spotlight/Command+Space).
3.  Maak het bestand uitvoerbaar met dit commando:
    ```bash
    chmod +x ~/Downloads/statement-convertor-macos
    ```
4.  Sleep het bestand naar een map naar keuze en start het via de Terminal.

---

## 📁 3. Hoe werkt de mappenstructuur?

Zodra je de tool voor de eerste keer start, maakt hij automatisch drie mappen aan in dezelfde map als waar de tool staat:

1.  **`input/`**: Plaats hier de PDF-uittreksels die je wilt omzetten. Je kunt meerdere bestanden tegelijk toevoegen.
2.  **`output/`**: Hier verschijnt het gegenereerde Excel-bestand (`statements-YYYY-MM-DD.xlsx`).
3.  **`processed/`**: Zodra een PDF succesvol is verwerkt, verplaatst de tool het bestand van `input` naar deze map. Zo voorkom je dat je bestanden dubbel verwerkt.

---

## ✅ 4. Automatische Verificatie

De tool bevat een ingebouwd controlesysteem voor je gemoedsrust. Tijdens het verwerken zie je verschillende statussen in het scherm:

*   **✅ Validated**: De tool heeft het "TOTAL" bedrag in de PDF gevonden en bevestigd dat dit exact overeenkomt met de som van alle gevonden transacties.
*   **✅ Processed**: Het bestand is verwerkt. (Wordt getoond als er geen totaalbedrag in de PDF stond om mee te vergelijken).
*   **⚠️ Total mismatch**: De tool heeft een verschil gevonden tussen het totaal in de PDF en de lijst met transacties. Controleer in dit geval het Excel-bestand handmatig.
*   **❌ Failed**: Er is iets misgegaan (bijv. een beschadigde PDF). De reden wordt erbij vermeld.

Aan het einde zie je een **Summary** met het totale aantal transacties en het **Grand Total** (het totale bedrag over alle bestanden heen).

---

## ❓ 5. Veelgestelde Vragen (FAQ)

**Mijn bestanden blijven in de `input` map staan?**
Als een bestand niet verwerkt kan worden (status `❌ Failed`), blijft het in de `input` map staan. Controleer de foutmelding in het scherm.

**Werkt dit ook voor andere banken?**
Momenteel is de tool geoptimaliseerd voor BNP Paribas Fortis en bpost bank credit card statements.

**Waarom zie ik "ExperimentalWarning" in mijn scherm?**
Dit is een melding van de techniek achter de tool (Node.js) en heeft geen invloed op de werking. Je kunt dit negeren.

---

*Veel succes met het versnellen van je onkostenverwerking!*
