/**
 * Test fixtures for banking system messages
 */

export const BANCS_XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<Transaction>
  <TransactionID>TXN789012345</TransactionID>
  <Amount>5000.00</Amount>
  <Currency>EUR</Currency>
  <DebitAccount>DE89123456789012345678</DebitAccount>
  <CreditAccount>FR1234567890123456789012</CreditAccount>
  <Description>International transfer</Description>
</Transaction>`;

export const BANCS_FLAT_SAMPLE = 'TXN123456789    ACC987654321    5000.00      EUR20240701International payment for invoice 12345     ';

export const BANCS_JSON_SAMPLE = {
  transactionId: 'TXN456789012',
  accountNumber: 'ACC123456789',
  amount: 2500.00,
  currency: 'USD',
  valueDate: '2024-07-01',
  description: 'Salary payment',
  customerName: 'John Doe',
  branchCode: 'BR001'
};

export const FIS_FIXED_WIDTH_SAMPLE = '01TXN123456789    ACC987654321    000250000USD20240701001Monthly payment to vendor ABC Corp           John Doe                                          BR01';

export const FIS_JSON_SAMPLE = {
  transactionId: 'TXN987654321',
  accountNumber: 'ACC456789012',
  amount: 7500.00,
  currency: 'USD',
  valueDate: '2024-07-01',
  transactionType: 'CREDIT',
  description: 'Invoice payment',
  customerName: 'Jane Smith',
  branchCode: 'BR002'
};

export const FISERV_DNA_SAMPLE = {
  transactionId: 'DNA123456789',
  accountNumber: 'DNA987654321',
  amount: 3000.00,
  currency: 'USD',
  valueDate: '2024-07-01',
  description: 'DNA system payment',
  customerName: 'Bob Johnson',
  branchCode: 'DNA001'
};

export const TEMENOS_JSON_SAMPLE = {
  header: {
    messageId: 'TMN123456789',
    timestamp: '2024-07-01T10:00:00Z',
    source: 'T24'
  },
  transaction: {
    id: 'TMN987654321',
    type: 'PAYMENT',
    amount: 4500.00,
    currency: 'EUR',
    valueDate: '2024-07-01'
  },
  debitAccount: {
    number: 'DE89123456789012345678',
    name: 'Sender Corp'
  },
  creditAccount: {
    number: 'FR1234567890123456789012',
    name: 'Receiver Ltd'
  },
  narrative: 'Business payment'
};

export const TEMENOS_XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<TemenosTransaction>
  <TransactionReference>TMN123456789</TransactionReference>
  <Amount>4500.00</Amount>
  <Currency>EUR</Currency>
  <ValueDate>2024-07-01</ValueDate>
  <DebitAccount>DE89123456789012345678</DebitAccount>
  <CreditAccount>FR1234567890123456789012</CreditAccount>
  <Narrative>XML based transaction</Narrative>
</TemenosTransaction>`;

export const TEMENOS_T24_SAMPLE = `TXN.REF=TMN123456789
AMOUNT=4500.00
CURRENCY=EUR
VALUE.DATE=2024-07-01
DEBIT.ACCT=DE89123456789012345678
CREDIT.ACCT=FR1234567890123456789012
NARRATIVE=T24 format transaction
CUSTOMER.NO=CUST001
PRODUCT.CODE=PAY001`;

export const ISO20022_PACS008_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>ISO123456789</MsgId>
      <CreDtTm>2024-07-01T10:00:00Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="EUR">4500.00</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>2024-07-01</IntrBkSttlmDt>
      <SttlmMtd>CLRG</SttlmMtd>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTR001</InstrId>
        <EndToEndId>E2E001</EndToEndId>
        <TxId>TXN001</TxId>
      </PmtId>
      <InstdAmt Ccy="EUR">4500.00</InstdAmt>
      <ChrgBr>SLEV</ChrgBr>
      <Dbtr>
        <Nm>Sender Corporation</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>DE89123456789012345678</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>DEUTDEFF</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <Cdtr>
        <Nm>Receiver Limited</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>FR1234567890123456789012</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BICFI>BNPAFRPP</BICFI>
        </FinInstnId>
      </CdtrAgt>
      <RmtInf>
        <Ustrd>Invoice payment ISO20022</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;