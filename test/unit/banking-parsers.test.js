/**
 * Unit tests for Banking Format Parsers
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import BANCSParser from '../../src/parsers/banking/bancs-parser.js';
import FISParser from '../../src/parsers/banking/fis-parser.js';
import FiservParser from '../../src/parsers/banking/fiserv-parser.js';
import TemenosParser from '../../src/parsers/banking/temenos-parser.js';
import ISO20022Parser from '../../src/parsers/iso20022/pacs008-parser.js';
import {
  BANCS_XML_SAMPLE,
  BANCS_FLAT_SAMPLE,
  BANCS_JSON_SAMPLE,
  FIS_FIXED_WIDTH_SAMPLE,
  FIS_JSON_SAMPLE,
  FISERV_DNA_SAMPLE,
  TEMENOS_JSON_SAMPLE,
  TEMENOS_XML_SAMPLE,
  TEMENOS_T24_SAMPLE,
  ISO20022_PACS008_SAMPLE
} from '../fixtures/banking-messages.js';

describe('Banking Format Parsers', () => {
  describe('BANCSParser', () => {
    let parser;

    beforeEach(() => {
      parser = new BANCSParser();
    });

    test('should initialize with supported formats', () => {
      expect(parser.supportedFormats).toContain('XML');
      expect(parser.supportedFormats).toContain('JSON');
      expect(parser.supportedFormats).toContain('FLAT');
    });

    test('should parse BANCS XML format', () => {
      const result = parser.parseXML(BANCS_XML_SAMPLE);
      
      expect(result.messageType).toBe('BANCS_XML');
      expect(result.transactionId).toBe('TXN789012345');
      expect(result.amount).toBe(5000.00);
      expect(result.currency).toBe('EUR');
      expect(result.debitAccount).toBe('DE89123456789012345678');
      expect(result.creditAccount).toBe('FR1234567890123456789012');
    });

    test('should parse BANCS JSON format', () => {
      const result = parser.parseJSON(JSON.stringify(BANCS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('BANCS_JSON');
      expect(result.transactionId).toBe('TXN456789012');
      expect(result.amount).toBe(2500.00);
      expect(result.currency).toBe('USD');
      expect(result.customerName).toBe('John Doe');
    });

    test('should parse BANCS flat file format', () => {
      const result = parser.parseFlat(BANCS_FLAT_SAMPLE);
      
      expect(result.messageType).toBe('BANCS_FLAT');
      expect(result.transactionId).toBe('TXN123456789');
      expect(result.accountNumber).toBe('ACC987654321');
      expect(result.amount).toBe(5000.00);
      expect(result.currency).toBe('EUR');
    });

    test('should validate BANCS XML structure', () => {
      expect(() => parser.parseXML('<invalid>xml</invalid>')).toThrow();
    });

    test('should validate BANCS JSON structure', () => {
      expect(() => parser.parseJSON('invalid json')).toThrow();
    });

    test('should validate BANCS flat file structure', () => {
      expect(() => parser.parseFlat('invalid')).toThrow();
    });

    test('should detect format automatically', () => {
      expect(parser.detectFormat(BANCS_XML_SAMPLE)).toBe('XML');
      expect(parser.detectFormat(JSON.stringify(BANCS_JSON_SAMPLE))).toBe('JSON');
      expect(parser.detectFormat(BANCS_FLAT_SAMPLE)).toBe('FLAT');
    });

    test('should standardize output format', () => {
      const result = parser.parseXML(BANCS_XML_SAMPLE);
      
      expect(result.timestamp).toBeDefined();
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parser).toBe('BANCS');
    });
  });

  describe('FISParser', () => {
    let parser;

    beforeEach(() => {
      parser = new FISParser();
    });

    test('should initialize with supported formats', () => {
      expect(parser.supportedFormats).toContain('FIXED_WIDTH');
      expect(parser.supportedFormats).toContain('JSON');
      expect(parser.supportedFormats).toContain('DELIMITED');
    });

    test('should parse FIS fixed width format', () => {
      const result = parser.parseFixedWidth(FIS_FIXED_WIDTH_SAMPLE);
      
      expect(result.messageType).toBe('FIS_FIXED');
      expect(result.transactionId).toBe('TXN123456789');
      expect(result.accountNumber).toBe('ACC987654321');
      expect(result.amount).toBe(2500.00);
      expect(result.currency).toBe('USD');
    });

    test('should parse FIS JSON format', () => {
      const result = parser.parseJSON(JSON.stringify(FIS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('FIS_JSON');
      expect(result.transactionId).toBe('TXN987654321');
      expect(result.amount).toBe(7500.00);
      expect(result.currency).toBe('USD');
      expect(result.transactionType).toBe('CREDIT');
    });

    test('should validate FIS fixed width structure', () => {
      expect(() => parser.parseFixedWidth('invalid')).toThrow();
    });

    test('should validate FIS JSON structure', () => {
      expect(() => parser.parseJSON('invalid json')).toThrow();
    });

    test('should detect format automatically', () => {
      expect(parser.detectFormat(FIS_FIXED_WIDTH_SAMPLE)).toBe('FIXED_WIDTH');
      expect(parser.detectFormat(JSON.stringify(FIS_JSON_SAMPLE))).toBe('JSON');
    });

    test('should handle record type parsing', () => {
      const result = parser.parseFixedWidth(FIS_FIXED_WIDTH_SAMPLE);
      
      expect(result.recordType).toBe('01');
      expect(result.customerName).toBe('John Doe');
      expect(result.branchCode).toBe('BR01');
    });

    test('should handle FIS delimited format', () => {
      const delimitedData = 'TXN123|ACC456|1000.00|USD|20240701|CREDIT|Test payment|John Smith|BR001';
      const result = parser.parseDelimited(delimitedData);
      
      expect(result.messageType).toBe('FIS_DELIMITED');
      expect(result.transactionId).toBe('TXN123');
      expect(result.amount).toBe(1000.00);
    });

    test('should validate delimited format', () => {
      expect(() => parser.parseDelimited('invalid')).toThrow();
    });

    test('should standardize output format', () => {
      const result = parser.parseFixedWidth(FIS_FIXED_WIDTH_SAMPLE);
      
      expect(result.timestamp).toBeDefined();
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parser).toBe('FIS');
    });
  });

  describe('FiservParser', () => {
    let parser;

    beforeEach(() => {
      parser = new FiservParser();
    });

    test('should initialize with Fiserv DNA support', () => {
      expect(parser.supportedSystems).toContain('DNA');
      expect(parser.supportedFormats).toContain('JSON');
    });

    test('should parse Fiserv DNA format', () => {
      const result = parser.parseDNA(JSON.stringify(FISERV_DNA_SAMPLE));
      
      expect(result.messageType).toBe('FISERV_DNA');
      expect(result.transactionId).toBe('DNA123456789');
      expect(result.accountNumber).toBe('DNA987654321');
      expect(result.amount).toBe(3000.00);
      expect(result.currency).toBe('USD');
      expect(result.customerName).toBe('Bob Johnson');
    });

    test('should validate Fiserv DNA structure', () => {
      expect(() => parser.parseDNA('invalid json')).toThrow();
    });

    test('should detect Fiserv format automatically', () => {
      expect(parser.detectFormat(JSON.stringify(FISERV_DNA_SAMPLE))).toBe('DNA');
    });

    test('should standardize output format', () => {
      const result = parser.parseDNA(JSON.stringify(FISERV_DNA_SAMPLE));
      
      expect(result.timestamp).toBeDefined();
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parser).toBe('FISERV');
    });

    test('should handle Fiserv-specific fields', () => {
      const result = parser.parseDNA(JSON.stringify(FISERV_DNA_SAMPLE));
      
      expect(result.branchCode).toBe('DNA001');
      expect(result.description).toBe('DNA system payment');
    });
  });

  describe('TemenosParser', () => {
    let parser;

    beforeEach(() => {
      parser = new TemenosParser();
    });

    test('should initialize with supported formats', () => {
      expect(parser.supportedFormats).toContain('JSON');
      expect(parser.supportedFormats).toContain('XML');
      expect(parser.supportedFormats).toContain('T24');
    });

    test('should parse Temenos JSON format', () => {
      const result = parser.parseJSON(JSON.stringify(TEMENOS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('TEMENOS_JSON');
      expect(result.header.messageId).toBe('TMN123456789');
      expect(result.transaction.amount).toBe(4500.00);
      expect(result.transaction.currency).toBe('EUR');
    });

    test('should parse Temenos XML format', () => {
      const result = parser.parseXML(TEMENOS_XML_SAMPLE);
      
      expect(result.messageType).toBe('TEMENOS_XML');
      expect(result.transactionReference).toBe('TMN123456789');
      expect(result.amount).toBe(4500.00);
      expect(result.currency).toBe('EUR');
    });

    test('should parse Temenos T24 format', () => {
      const result = parser.parseT24(TEMENOS_T24_SAMPLE);
      
      expect(result.messageType).toBe('TEMENOS_T24');
      expect(result.transactionReference).toBe('TMN123456789');
      expect(result.amount).toBe(4500.00);
      expect(result.currency).toBe('EUR');
    });

    test('should validate Temenos JSON structure', () => {
      expect(() => parser.parseJSON('invalid json')).toThrow();
    });

    test('should validate Temenos XML structure', () => {
      expect(() => parser.parseXML('<invalid>xml</invalid>')).toThrow();
    });

    test('should detect format automatically', () => {
      expect(parser.detectFormat(JSON.stringify(TEMENOS_JSON_SAMPLE))).toBe('JSON');
      expect(parser.detectFormat(TEMENOS_XML_SAMPLE)).toBe('XML');
      expect(parser.detectFormat(TEMENOS_T24_SAMPLE)).toBe('T24');
    });

    test('should standardize output format', () => {
      const result = parser.parseJSON(JSON.stringify(TEMENOS_JSON_SAMPLE));
      
      expect(result.timestamp).toBeDefined();
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parser).toBe('TEMENOS');
    });
  });

  describe('ISO20022Parser', () => {
    let parser;

    beforeEach(() => {
      parser = new ISO20022Parser();
    });

    test('should initialize with supported message types', () => {
      expect(parser.supportedMessageTypes).toContain('pacs.008');
      expect(parser.supportedMessageTypes).toContain('pacs.009');
      expect(parser.supportedMessageTypes).toContain('camt.053');
    });

    test('should parse ISO20022 pacs.008 message', () => {
      const result = parser.parsePacs008(ISO20022_PACS008_SAMPLE);
      
      expect(result.messageType).toBe('pacs.008');
      expect(result.groupHeader.messageId).toBe('ISO123456789');
      expect(result.groupHeader.numberOfTransactions).toBe(1);
      expect(result.creditTransferTransactionInformation.instructedAmount.amount).toBe(4500.00);
      expect(result.creditTransferTransactionInformation.instructedAmount.currency).toBe('EUR');
    });

    test('should validate ISO20022 XML structure', () => {
      expect(() => parser.parsePacs008('<invalid>xml</invalid>')).toThrow();
    });

    test('should extract payment information', () => {
      const result = parser.parsePacs008(ISO20022_PACS008_SAMPLE);
      
      expect(result.creditTransferTransactionInformation.debtor.name).toBe('Sender Corporation');
      expect(result.creditTransferTransactionInformation.creditor.name).toBe('Receiver Limited');
      expect(result.creditTransferTransactionInformation.debtorAccount.iban).toBe('DE89123456789012345678');
    });

    test('should standardize output format', () => {
      const result = parser.parsePacs008(ISO20022_PACS008_SAMPLE);
      
      expect(result.timestamp).toBeDefined();
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parser).toBe('ISO20022');
    });

    test('should handle namespace validation', () => {
      const invalidNamespace = ISO20022_PACS008_SAMPLE.replace('pacs.008.001.10', 'invalid.namespace');
      
      expect(() => parser.parsePacs008(invalidNamespace)).toThrow();
    });

    test('should parse other ISO20022 message types', () => {
      expect(() => parser.parsePacs009('pacs.009 test')).toThrow();
      expect(() => parser.parseCamt053('camt.053 test')).toThrow();
      expect(() => parser.parseCamt052('camt.052 test')).toThrow();
    });
  });

  describe('Cross-parser compatibility', () => {
    test('should produce consistent output structure across parsers', () => {
      const bancsParser = new BANCSParser();
      const fisParser = new FISParser();
      const temenosParser = new TemenosParser();
      
      const bancsResult = bancsParser.parseJSON(JSON.stringify(BANCS_JSON_SAMPLE));
      const fisResult = fisParser.parseJSON(JSON.stringify(FIS_JSON_SAMPLE));
      const temenosResult = temenosParser.parseJSON(JSON.stringify(TEMENOS_JSON_SAMPLE));
      
      // All should have consistent metadata structure
      expect(bancsResult.parseMetadata).toBeDefined();
      expect(fisResult.parseMetadata).toBeDefined();
      expect(temenosResult.parseMetadata).toBeDefined();
      
      // All should have timestamp
      expect(bancsResult.timestamp).toBeDefined();
      expect(fisResult.timestamp).toBeDefined();
      expect(temenosResult.timestamp).toBeDefined();
    });
  });
});