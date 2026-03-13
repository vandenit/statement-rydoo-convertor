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

---

## Usage (for Users/Clients)

### Recommended: GitHub Releases
The easiest way to get the latest version is to download the portable binaries from the **[Releases](https://github.com/vandenit/statement-convertor/releases)** page on GitHub.
- `statement-convertor-win.exe` (Windows)
- `statement-convertor-macos-x64` (Mac Intel)
- `statement-convertor-macos-arm64` (Mac M1/M2/M3)

### Operating System Notes
- **Windows**: Just run the `.exe`. 
- **macOS**: Since the app is not signed, you might need to **Right-click -> Open** on the first launch, or run `codesign --sign - <path_to_binary>` in the terminal to authorize it.

---

## Technical Documentation (for Developers)

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

### Automation & Deployment
- **CI/CD**: A GitHub Action is configured to automatically build and create a GitHub Release whenever a tag (e.g., `v1.1.0`) is pushed to the repository.
- **Manual Delivery**: 
  1. Run `npm run build:exe` and `npm run build:macos`.
  2. Send the binaries from `dist-exe/` and `dist-macos/` to the client.
