#!/bin/bash

# Enhanced Binary Smoke Test
# Verifies that a bundled binary can actually parse a PDF.

set -e

BINARY_PATH=$1

if [ -z "$BINARY_PATH" ]; then
  echo "❌ Error: No binary path provided."
  echo "Usage: ./scripts/test-binary.sh <path-to-binary>"
  exit 1
fi

echo "🔍 Starting E2E smoke test for: $BINARY_PATH"

# Setup temporary workspace
TEST_DIR=$(mktemp -d)
echo "📂 Using temp directory: $TEST_DIR"

# Move the binary to the test directory to ensure it's self-contained
# and doesn't 'leak' and find node_modules in parent folders
cp "$BINARY_PATH" "$TEST_DIR/bin-to-test"
chmod +x "$TEST_DIR/bin-to-test"
BINARY_TO_RUN="./bin-to-test"

mkdir -p "$TEST_DIR/input"
mkdir -p "$TEST_DIR/output"
mkdir -p "$TEST_DIR/processed"

# Copy a sample PDF from the repository
# We need to use the absolute path of the current directory to find it
SOURCE_DIR=$(pwd)
SAMPLE_PDF="$SOURCE_DIR/example_docs/VAN DEN BROECK CHARLOTTE-5480 28XX XXXX 8204-20260205.pdf"

if [ ! -f "$SAMPLE_PDF" ]; then
  echo "⚠️ Preferred sample not found, looking for any PDF in example_docs/..."
  SAMPLE_PDF=$(find "$SOURCE_DIR/example_docs" -name "*.pdf" | head -n 1)
fi

if [ -z "$SAMPLE_PDF" ] || [ ! -f "$SAMPLE_PDF" ]; then
  echo "❌ Error: No sample PDF found for testing."
  exit 1
fi

cp "$SAMPLE_PDF" "$TEST_DIR/input/test.pdf"
echo "📄 Copied sample: $SAMPLE_PDF"

# Run the binary
cd "$TEST_DIR"

echo "⚙️ Running binary..."
"$BINARY_TO_RUN" --input ./input --output ./output --processed ./processed

# Verify output
EXCEL_FILE=$(find ./output -name "*.xlsx")

if [ -f "$EXCEL_FILE" ]; then
  echo "✅ Success! Excel file generated: $EXCEL_FILE"
  # Cleanup
  cd - > /dev/null
  rm -rf "$TEST_DIR"
  echo "🧹 Cleanup complete."
  exit 0
else
  echo "❌ Failure! No Excel file was generated."
  # Keep TEST_DIR for debugging if it fails
  echo "📁 Test directory preserved at: $TEST_DIR"
  exit 1
fi
