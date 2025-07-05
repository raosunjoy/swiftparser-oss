/**
 * Basic SwiftParser-OSS Usage Examples
 * Demonstrates parsing various banking message formats
 */

import SwiftParserOSS from '../src/index.js';

const parser = new SwiftParserOSS();

// Example 1: Parse MT103 SWIFT message
console.log('🔄 Example 1: MT103 SWIFT Message');
const mt103Message = `{1:F01AAAAGRA0AXXX1234123456}{2:I103BBBBGRB0XXXXN}{4:
:20:123456789
:23B:CRED
:32A:230701USD1000,00
:50K:/12345678
    SENDER BANK NAME
    SENDER ADDRESS
:52A:AAAAGRA0
:57A:BBBBGRB0
:59:/98765432
    BENEFICIARY NAME
    BENEFICIARY ADDRESS
:70:INVOICE PAYMENT REF 12345
:71A:OUR
-}`;

try {
  const result = parser.parse(mt103Message, 'MT103');
  console.log('✅ Parsed MT103:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ MT103 parsing failed:', error.message);
}

// Example 2: Parse Fiserv DNA format
console.log('\n🔄 Example 2: Fiserv DNA Message');
const fiservMessage = {
  transactionId: "TXN123456789",
  accountNumber: "ACC987654321",
  amount: 2500.00,
  currency: "USD",
  valueDate: "2024-07-01",
  description: "Salary payment",
  customerName: "John Doe",
  branchCode: "BR001"
};

try {
  const result = parser.fiserv.parse(JSON.stringify(fiservMessage), 'JSON');
  console.log('✅ Parsed Fiserv:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Fiserv parsing failed:', error.message);
}

// Example 3: Parse BaNCS XML
console.log('\n🔄 Example 3: BaNCS XML Message');
const bancsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Transaction>
  <TransactionID>TXN789012345</TransactionID>
  <Amount>5000.00</Amount>
  <Currency>EUR</Currency>
  <DebitAccount>DE89123456789012345678</DebitAccount>
  <CreditAccount>FR1234567890123456789012</CreditAccount>
  <Description>International transfer</Description>
</Transaction>`;

try {
  const result = parser.bancs.parse(bancsXml, 'XML');
  console.log('✅ Parsed BaNCS:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ BaNCS parsing failed:', error.message);
}

// Example 4: Format detection
console.log('\n🔄 Example 4: Auto-format Detection');
const swiftMessage = ':20:REF123456\n:32A:230701USD500,00\n:50K:/11111111\n    TEST BANK';

try {
  const result = parser.parse(swiftMessage); // No format specified
  console.log('✅ Auto-detected and parsed:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Auto-detection failed:', error.message);
}

// Example 5: COBOL detection (enterprise feature)
console.log('\n🔄 Example 5: COBOL Detection');
const cobolCode = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. PAYMENT-PROCESSOR.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 PAYMENT-AMOUNT PIC 9(8)V99 COMP-3.
       PROCEDURE DIVISION.
       PROCESS-PAYMENT.
           MOVE 1000.00 TO PAYMENT-AMOUNT.
           DISPLAY "Processing payment: " PAYMENT-AMOUNT.
`;

try {
  const result = parser.parse(cobolCode);
  console.log('✅ COBOL result:', result);
} catch (error) {
  console.log('ℹ️  Expected:', error.message);
}

// Example 6: Get supported formats
console.log('\n📋 Supported Formats:');
const formats = parser.getSupportedFormats();
formats.forEach(format => console.log(`  - ${format}`));

console.log('\n🎉 Examples completed!');
console.log('💡 For enterprise features (COBOL, compliance, blockchain), contact enterprise@gridworks.ai');