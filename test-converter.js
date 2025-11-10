/**
 * Test script for CSV to XLSX converter
 * Tests with real CSV file: /home/silver/csvtest.csv
 */

const fs = require('fs');
const path = require('path');

// Simulate the parseCSVLine function
function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Test the conversion logic
async function testConversion() {
  console.log('🧪 Testing CSV to XLSX Converter\n');

  // Read the test CSV file
  const csvPath = '/home/silver/csvtest.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  console.log(`📄 Test file: ${csvPath}`);
  console.log(`📊 Total lines: ${lines.length}\n`);

  // Parse first few lines
  const delimiter = ',';
  const COLUMN_INDICES = [0, 1, 2, 3, 4, 6];
  const COLUMN_NAMES = ['ID', 'Name', 'Date', 'Time', 'Type', 'Status'];

  console.log('📋 Column Extraction Configuration:');
  console.log(`   Indices: [${COLUMN_INDICES.join(', ')}]`);
  console.log(`   Names: [${COLUMN_NAMES.join(', ')}]\n`);

  // Parse first 5 lines to verify structure
  console.log('🔍 Sample Data (first 5 rows):\n');

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parsed = parseCSVLine(lines[i], delimiter);
    console.log(`Row ${i + 1}:`);
    console.log(`   Full row (${parsed.length} columns): ${JSON.stringify(parsed)}`);

    const extracted = COLUMN_INDICES.map(idx => parsed[idx] || '');
    console.log(`   Extracted: ${JSON.stringify(extracted)}`);

    const mapped = {};
    COLUMN_NAMES.forEach((name, idx) => {
      mapped[name] = extracted[idx];
    });
    console.log(`   Mapped: ${JSON.stringify(mapped)}\n`);
  }

  // Validate column count
  const firstRow = parseCSVLine(lines[0], delimiter);
  const maxIndex = Math.max(...COLUMN_INDICES);

  console.log('✅ Validation:');
  console.log(`   CSV has ${firstRow.length} columns`);
  console.log(`   Required: column index ${maxIndex} (column ${maxIndex + 1})`);

  if (firstRow.length <= maxIndex) {
    console.log('   ❌ ERROR: Not enough columns!\n');
    return false;
  } else {
    console.log(`   ✅ SUCCESS: CSV has enough columns!\n`);
  }

  // Statistics
  const allParsed = lines.map(line => parseCSVLine(line, delimiter));
  const extracted = allParsed.map(row => COLUMN_INDICES.map(idx => row[idx] || ''));

  console.log('📊 Conversion Statistics:');
  console.log(`   Input rows: ${lines.length}`);
  console.log(`   Output rows: ${extracted.length}`);
  console.log(`   Input columns: ${firstRow.length}`);
  console.log(`   Output columns: ${COLUMN_NAMES.length}\n`);

  // Check for data in each column
  console.log('📈 Data Analysis:');
  COLUMN_NAMES.forEach((name, idx) => {
    const nonEmpty = extracted.filter(row => row[idx] && row[idx].trim()).length;
    const percentage = ((nonEmpty / extracted.length) * 100).toFixed(1);
    console.log(`   ${name}: ${nonEmpty}/${extracted.length} rows (${percentage}% filled)`);
  });

  console.log('\n✅ Test completed successfully!');
  return true;
}

// Run the test
testConversion().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
