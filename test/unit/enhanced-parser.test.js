/**
 * Unit tests for Enhanced SWIFT Parser
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import EnhancedSWIFTParser from '../../src/parsers/swift/enhanced-parser.js';
import { 
  VALID_MT103,
  VALID_MT202 
} from '../fixtures/swift-messages.js';
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

describe('EnhancedSWIFTParser', () => {
  let parser;

  beforeEach(() => {
    parser = new EnhancedSWIFTParser();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(parser.config.strictValidation).toBe(true);
      expect(parser.config.enableLogging).toBe(true);
      expect(parser.config.outputFormat).toBe('json');
      expect(parser.supportedMessageTypes).toContain('MT103');
      expect(parser.supportedMessageTypes).toContain('MT202');
    });

    test('should accept custom configuration', () => {
      const customParser = new EnhancedSWIFTParser({
        strictValidation: false,
        outputFormat: 'xml',
        blockchainFormat: 'hyperledger'
      });
      
      expect(customParser.config.strictValidation).toBe(false);
      expect(customParser.config.outputFormat).toBe('xml');
      expect(customParser.config.blockchainFormat).toBe('hyperledger');
    });

    test('should initialize metrics tracking', () => {
      expect(parser.metrics.totalParsed).toBe(0);
      expect(parser.metrics.successfulParses).toBe(0);
      expect(parser.metrics.failedParses).toBe(0);
      expect(parser.metrics.averageParseTime).toBe(0);
    });
  });

  describe('detectMessageFormat() method', () => {
    test('should detect MT103 format', () => {
      const format = parser.detectMessageFormat(VALID_MT103);
      expect(format).toBe('MT103');
    });

    test('should detect MT202 format', () => {
      const format = parser.detectMessageFormat(VALID_MT202);
      expect(format).toBe('MT202');
    });

    test('should detect ISO20022 format', () => {
      const format = parser.detectMessageFormat(ISO20022_PACS008_SAMPLE);
      expect(format).toBe('ISO20022');
    });

    test('should detect BANCS XML format', () => {
      const format = parser.detectMessageFormat(BANCS_XML_SAMPLE);
      expect(format).toBe('BANCS_XML');
    });

    test('should detect BANCS JSON format', () => {
      const format = parser.detectMessageFormat(JSON.stringify(BANCS_JSON_SAMPLE));
      expect(format).toBe('BANCS_JSON');
    });

    test('should detect FIS fixed width format', () => {
      const format = parser.detectMessageFormat(FIS_FIXED_WIDTH_SAMPLE);
      expect(format).toBe('FIS_FIXED');
    });

    test('should detect Temenos JSON format', () => {
      const format = parser.detectMessageFormat(JSON.stringify(TEMENOS_JSON_SAMPLE));
      expect(format).toBe('TEMENOS_JSON');
    });

    test('should detect Temenos XML format', () => {
      const format = parser.detectMessageFormat(TEMENOS_XML_SAMPLE);
      expect(format).toBe('TEMENOS_XML');
    });

    test('should return unknown for unrecognized format', () => {
      const format = parser.detectMessageFormat('invalid message format');
      expect(format).toBe('UNKNOWN');
    });

    test('should handle null or non-string input', () => {
      expect(parser.detectMessageFormat(null)).toBe('UNKNOWN');
      expect(parser.detectMessageFormat(undefined)).toBe('UNKNOWN');
      expect(parser.detectMessageFormat(123)).toBe('UNKNOWN');
      expect(parser.detectMessageFormat('')).toBe('UNKNOWN');
    });

    test('should detect FISERV_DNA format', () => {
      const format = parser.detectMessageFormat(JSON.stringify(FISERV_DNA_SAMPLE));
      expect(format).toBe('FISERV_DNA');
    });
  });

  describe('parseMessage() method', () => {
    test('should parse MT103 message successfully', async () => {
      const result = await parser.parseMessage(VALID_MT103);
      
      expect(result.messageType).toBe('MT103');
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.parseId).toBeDefined();
      expect(result.parseMetadata.originalFormat).toBe('MT103');
      expect(result.parseMetadata.parseTime).toBeGreaterThan(0);
    });

    test('should parse MT202 message successfully', async () => {
      const result = await parser.parseMessage(VALID_MT202);
      
      expect(result.messageType).toBe('MT202');
      expect(result.parseMetadata).toBeDefined();
      expect(result.parseMetadata.originalFormat).toBe('MT202');
    });

    test('should throw error for unsupported message format', async () => {
      await expect(parser.parseMessage('invalid message', 'UNSUPPORTED'))
        .rejects.toThrow('Unsupported message format: UNSUPPORTED');
    });

    test('should include compliance data when enabled', async () => {
      const result = await parser.parseMessage(VALID_MT103);
      
      expect(result.complianceData).toBeDefined();
    });

    test('should handle blockchain conversion request', async () => {
      const result = await parser.parseMessage(VALID_MT103, null, { blockchainFormat: 'ethereum' });
      
      expect(result.blockchainPayload).toBeDefined();
    });

    test('should parse all supported SWIFT message types', async () => {
      const messageTypes = ['MT103', 'MT202', 'MT515', 'MT700', 'MT798', 'MT950', 'MT101'];
      
      for (const messageType of messageTypes) {
        const result = await parser.parseMessage(VALID_MT103, messageType);
        expect(result.messageType).toBe(messageType);
      }
    });

    test('should parse BANCS flat file message', async () => {
      const result = await parser.parseMessage(BANCS_FLAT_SAMPLE, 'BANCS_FLAT');
      expect(result.messageType).toBe('BANCS_FLAT');
    });

    test('should parse FIS delimited message', async () => {
      const result = await parser.parseMessage('test|delimited|message', 'FIS_DELIMITED');
      expect(result.messageType).toBe('FIS_DELIMITED');
    });
  });

  describe('Enterprise feature stubs', () => {
    test('convertToBlockchain should throw enterprise error', () => {
      expect(() => parser.convertToBlockchain())
        .toThrow('Blockchain conversion requires SwiftParser Enterprise');
    });

    test('should throw errors for all enterprise features', async () => {
      await expect(parser.parseSEPA('test')).rejects.toThrow('SEPA parsing requires SwiftParser Enterprise');
      await expect(parser.parseACHNACHA('test')).rejects.toThrow('ACH/NACHA parsing requires SwiftParser Enterprise');
      await expect(parser.parseEDIFACT('test')).rejects.toThrow('EDIFACT parsing requires SwiftParser Enterprise');
      await expect(parser.parseMTS('test')).rejects.toThrow('MTS parsing requires SwiftParser Enterprise');
    });
  });

  describe('parseSWIFTMessage() method', () => {
    test('should parse SWIFT MT103 message', async () => {
      const result = await parser.parseSWIFTMessage(VALID_MT103, 'MT103');
      
      expect(result.messageType).toBe('MT103');
      expect(result.transactionReference).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(result.currency).toBeDefined();
    });

    test('should parse SWIFT MT202 message', async () => {
      const result = await parser.parseSWIFTMessage(VALID_MT202, 'MT202');
      
      expect(result.messageType).toBe('MT202');
      expect(result.transactionReference).toBeDefined();
      expect(result.amount).toBeDefined();
    });

    test('should throw error for invalid SWIFT message', async () => {
      await expect(parser.parseSWIFTMessage('invalid', 'MT103'))
        .rejects.toThrow();
    });
  });

  describe('parseISO20022() method', () => {
    test('should parse ISO20022 pacs.008 message', async () => {
      const result = await parser.parseISO20022(ISO20022_PACS008_SAMPLE);
      
      expect(result.messageType).toBe('pacs.008');
      expect(result.groupHeader).toBeDefined();
      expect(result.creditTransferTransactionInformation).toBeDefined();
    });

    test('should throw error for invalid ISO20022 XML', async () => {
      await expect(parser.parseISO20022('<invalid>xml</invalid>'))
        .rejects.toThrow();
    });
  });

  describe('parseBANCSXML() method', () => {
    test('should parse BANCS XML message', async () => {
      const result = await parser.parseBANCSXML(BANCS_XML_SAMPLE);
      
      expect(result.messageType).toBe('BANCS_XML');
      expect(result.transactionId).toBe('TXN789012345');
      expect(result.amount).toBe(5000.00);
      expect(result.currency).toBe('EUR');
    });

    test('should throw error for invalid BANCS XML', async () => {
      await expect(parser.parseBANCSXML('<invalid>xml</invalid>'))
        .rejects.toThrow();
    });
  });

  describe('parseBANCSFlatFile() method', () => {
    test('should parse BANCS flat file message', async () => {
      const result = await parser.parseBANCSFlatFile(BANCS_FLAT_SAMPLE);
      
      expect(result.messageType).toBe('BANCS_FLAT');
      expect(result.transactionId).toBe('TXN123456789');
      expect(result.accountNumber).toBe('ACC987654321');
      expect(result.amount).toBe(5000.00);
      expect(result.currency).toBe('EUR');
    });

    test('should throw error for invalid BANCS flat file', async () => {
      await expect(parser.parseBANCSFlatFile('invalid'))
        .rejects.toThrow();
    });
  });

  describe('parseBANCSJSON() method', () => {
    test('should parse BANCS JSON message', async () => {
      const result = await parser.parseBANCSJSON(JSON.stringify(BANCS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('BANCS_JSON');
      expect(result.transactionId).toBe('TXN456789012');
      expect(result.amount).toBe(2500.00);
      expect(result.currency).toBe('USD');
    });

    test('should throw error for invalid JSON', async () => {
      await expect(parser.parseBANCSJSON('invalid json'))
        .rejects.toThrow();
    });
  });

  describe('parseFISFixedWidth() method', () => {
    test('should parse FIS fixed width message', async () => {
      const result = await parser.parseFISFixedWidth(FIS_FIXED_WIDTH_SAMPLE);
      
      expect(result.messageType).toBe('FIS_FIXED');
      expect(result.transactionId).toBe('TXN123456789');
      expect(result.accountNumber).toBe('ACC987654321');
      expect(result.amount).toBe(2500.00);
      expect(result.currency).toBe('USD');
    });

    test('should throw error for invalid FIS fixed width', async () => {
      await expect(parser.parseFISFixedWidth('invalid'))
        .rejects.toThrow();
    });
  });

  describe('parseFISJSON() method', () => {
    test('should parse FIS JSON message', async () => {
      const result = await parser.parseFISJSON(JSON.stringify(FIS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('FIS_JSON');
      expect(result.transactionId).toBe('TXN987654321');
      expect(result.amount).toBe(7500.00);
      expect(result.currency).toBe('USD');
    });

    test('should throw error for invalid JSON', async () => {
      await expect(parser.parseFISJSON('invalid json'))
        .rejects.toThrow();
    });
  });

  describe('parseTemenosJSON() method', () => {
    test('should parse Temenos JSON message', async () => {
      const result = await parser.parseTemenosJSON(JSON.stringify(TEMENOS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('TEMENOS_JSON');
      expect(result.header.messageId).toBe('TMN123456789');
      expect(result.transaction.amount).toBe(4500.00);
      expect(result.transaction.currency).toBe('EUR');
    });

    test('should throw error for invalid JSON', async () => {
      await expect(parser.parseTemenosJSON('invalid json'))
        .rejects.toThrow();
    });
  });

  describe('parseTemenosXML() method', () => {
    test('should parse Temenos XML message', async () => {
      const result = await parser.parseTemenosXML(TEMENOS_XML_SAMPLE);
      
      expect(result.messageType).toBe('TEMENOS_XML');
      expect(result.transactionReference).toBe('TMN123456789');
      expect(result.amount).toBe(4500.00);
      expect(result.currency).toBe('EUR');
    });

    test('should throw error for invalid XML', async () => {
      await expect(parser.parseTemenosXML('<invalid>xml</invalid>'))
        .rejects.toThrow();
    });
  });

  describe('extractComplianceData() method', () => {
    test('should extract compliance data from parsed message', () => {
      const mockParsedMessage = {
        messageType: 'MT103',
        transactionReference: '123456789',
        amount: 100000,
        currency: 'USD'
      };
      
      const compliance = parser.extractComplianceData(mockParsedMessage);
      
      expect(compliance.amlFlags).toBeDefined();
      expect(compliance.sanctionsCheck).toBeDefined();
      expect(compliance.riskScore).toBeDefined();
    });

    test('should handle messages without compliance data', () => {
      const mockParsedMessage = {
        messageType: 'UNKNOWN'
      };
      
      const compliance = parser.extractComplianceData(mockParsedMessage);
      
      expect(compliance.amlFlags).toEqual([]);
      expect(compliance.riskScore).toBe(0);
    });
  });

  describe('Performance metrics', () => {
    test('should track parsing metrics', async () => {
      const initialTotal = parser.metrics.totalParsed;
      
      await parser.parseMessage(VALID_MT103);
      
      expect(parser.metrics.totalParsed).toBe(initialTotal + 1);
      expect(parser.metrics.successfulParses).toBeGreaterThan(0);
    });

    test('should track failed parsing metrics', async () => {
      const initialFailed = parser.metrics.failedParses;
      
      try {
        await parser.parseMessage('invalid message', 'UNSUPPORTED');
      } catch (error) {
        // Expected error
      }
      
      expect(parser.metrics.failedParses).toBe(initialFailed + 1);
    });
  });

  describe('Batch processing', () => {
    test('should process multiple messages in batch', async () => {
      const messages = [VALID_MT103, VALID_MT202];
      
      const results = await parser.batchParseMessages(messages);
      
      expect(results).toHaveLength(2);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].messageType).toBe('MT202');
    });

    test('should handle batch processing errors gracefully', async () => {
      const messages = [VALID_MT103, 'invalid message'];
      
      const results = await parser.batchParseMessages(messages);
      
      expect(results).toHaveLength(2);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].error).toBeDefined();
    });
  });
});