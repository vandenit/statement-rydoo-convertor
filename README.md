# Statement Convertor

A portable command-line tool to convert bank statement PDFs (specifically BNP Paribas Fortis credit card statements) into Rydoo-compatible Excel files.

## Features
- **Multi-file Aggregation**: Automatically combines all PDFs in the `input/` folder into a single Excel file.
- **Rydoo Compatible**: Generates the exact two-row header and column mapping required for Rydoo personal transaction imports.
- **Smart Parsing**: Handles foreign currencies, multiline descriptions, and European number formats (e.g., `1.045,00`).
- **Portable**: Run directly on Windows or macOS without installing Node.js or any dependencies.

## Directory Structure
- `input/`: Place your bank statement PDFs here.
- `output/`: The generated Excel file (`statements-YYYY-MM-DD.xlsx`) will appear here.
- `processed/`: PDFs are moved here after successful conversion.

## Usage

### Windows
1. Open the `dist-exe/` folder.
2. Run `statement-convertor.exe`.
3. Check the `output/` folder for your Excel file.

### macOS
1. Open the `dist-macos/` folder.
2. Use the version matching your Mac:
   - Intel Macs: `statement-convertor-x64`
   - Apple Silicon (M1/M2/M3): `statement-convertor-arm64`
3. **First-time run**: Since the app is not signed, you might need to Right-click -> Open, or run `codesign --sign - <path_to_binary>` in the terminal.

---

## Developer Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
# Run the tool in watch mode (requires PDFs in input/)
npm run dev
```

### Build Processes
```bash
# Compile TypeScript to JavaScript
npm run build

# Generate Windows portable executable
npm run build:exe

# Generate macOS portable binaries (Intel & Apple Silicon)
npm run build:macos
```

## Delivery
To deliver the latest version to a client:
1. Run `npm run build:exe` and `npm run build:macos`.
2. Send the content of `dist-exe/` (for Windows users).
3. Send the content of `dist-macos/` (for Mac users).
4. (Optional) Provide the `input/`, `output/`, and `processed/` folders as a template.
