# Parser Test Suite

This directory contains test files for the M-Pesa CSV parser.

## Directory Structure

```
tests/parser/
├── parser.test.ts           # Main test suite
├── samples/                 # Sample CSV files for testing
│   ├── safaricom-v1-sample.csv
│   ├── safaricom-v2-sample.csv
│   ├── safaricom-v1-semicolon.csv
│   └── generic-sample.csv
└── README.md               # This file
```

## Sample Files

### safaricom-v1-sample.csv
Standard Safaricom M-Pesa export format with comma delimiter.

**Format**:
- Delimiter: Comma (`,`)
- Headers: Transaction Date, Details, Transaction Status, Paid In, Withdrawn, Balance
- Decimal separator: Period (`.`)

### safaricom-v2-sample.csv
Newer Safaricom M-Pesa export format with receipt numbers.

**Format**:
- Delimiter: Comma (`,`)
- Headers: Receipt No, Completion Time, Details, Transaction Status, Paid In, Withdrawn, Balance, Balance Confirmed
- Decimal separator: Period (`.`)
- Includes receipt numbers for transaction IDs

### safaricom-v1-semicolon.csv
Safaricom format with semicolon delimiter and European number format.

**Format**:
- Delimiter: Semicolon (`;`)
- Headers: Same as safaricom-v1
- Decimal separator: Comma (`,`)

### generic-sample.csv
Simplified generic CSV format.

**Format**:
- Delimiter: Comma (`,`)
- Headers: Date, Amount, Narrative, Balance
- Amount: Negative for outgoing, positive for incoming

## Running Tests

```bash
# Run all tests
yarn test

# Run parser tests only
yarn test:parser

# Run with coverage
yarn test:coverage

# Watch mode
yarn test:watch
```

## Test Coverage

The test suite covers:

1. **Format Detection**
   - Safaricom V1 format
   - Safaricom V2 format
   - Generic format
   - Unknown format handling

2. **Transaction Parsing**
   - Amount parsing (with currency symbols)
   - Direction detection (in/out/transfer)
   - Balance extraction
   - Counterparty extraction from narratives

3. **Error Handling**
   - Empty CSV files
   - CSV with only headers
   - Malformed data
   - Unknown formats

4. **Confidence Scoring**
   - High confidence for valid data (>0.9)
   - Lower confidence for partial data
   - Error impact on confidence

## Adding New Test Cases

To add a new test case:

1. **Create a sample CSV file** in `samples/` directory
2. **Add a test** in `parser.test.ts`:

```typescript
describe('Your New Format', () => {
  let sampleContent: string

  beforeAll(() => {
    const samplePath = path.join(
      process.cwd(),
      'tests',
      'parser',
      'samples',
      'your-sample.csv'
    )
    sampleContent = fs.readFileSync(samplePath, 'utf-8')
  })

  test('should parse your format correctly', () => {
    const result = parseMpesaCSV(sampleContent)
    
    expect(result.success).toBe(true)
    expect(result.detectedFormat).toBe('your-format')
    expect(result.confidence).toBeGreaterThan(0.9)
  })
})
```

## Parser Confidence Thresholds

- **≥0.95**: Excellent - ready for production
- **0.80-0.94**: Good - may need minor improvements
- **0.60-0.79**: Fair - requires attention
- **<0.60**: Poor - significant issues

## Quality Gates

The CI pipeline enforces:

- Parse success rate: **≥95%**
- Average confidence: **≥0.9**
- All tests passing
- No regressions

## Common Test Patterns

### Testing parse success
```typescript
test('should parse format correctly', () => {
  const result = parseMpesaCSV(csvContent)
  expect(result.success).toBe(true)
})
```

### Testing transaction count
```typescript
test('should extract all transactions', () => {
  const result = parseMpesaCSV(csvContent)
  expect(result.transactions.length).toBe(expectedCount)
})
```

### Testing error handling
```typescript
test('should handle malformed data', () => {
  const result = parseMpesaCSV(malformedCsv)
  expect(result.success).toBe(false)
  expect(result.errors.length).toBeGreaterThan(0)
})
```

## CSV Format Specifications

### Safaricom V1
```
Transaction Date,Details,Transaction Status,Paid In,Withdrawn,Balance
DD/MM/YYYY HH:MM:SS,Narrative text,Status,Amount,Amount,Amount
```

### Safaricom V2
```
Receipt No,Completion Time,Details,Transaction Status,Paid In,Withdrawn,Balance,Balance Confirmed
REF123,DD/MM/YYYY HH:MM:SS,Narrative text,Status,Amount,Amount,Amount,Yes/No
```

### Generic
```
Date,Amount,Narrative,Balance
YYYY-MM-DD,±Amount,Narrative text,Amount
```

## Debugging Failed Tests

1. **Check the error message**: Look at `result.errors` array
2. **Verify format detection**: Check `result.detectedFormat`
3. **Review confidence score**: Low score indicates data quality issues
4. **Inspect sample data**: Ensure CSV is properly formatted
5. **Check delimiters**: Verify comma vs semicolon usage

## CI/CD Integration

The GitHub Actions workflow runs these tests automatically:

- **Trigger**: Push or PR to main/develop
- **Matrix**: Node.js 18.x and 20.x
- **Artifacts**: Test results and coverage reports
- **Duration**: ~1-2 minutes

View workflow: `.github/workflows/parser-ci.yml`

## Contributing

When adding new features to the parser:

1. Add sample CSV files representing the new format
2. Write tests covering the new functionality
3. Ensure tests pass locally: `yarn test:parser`
4. Update parser.ts with new format detection
5. Update this README with format specifications

## License

Same as the main project.
