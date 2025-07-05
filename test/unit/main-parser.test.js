/**
 * Unit tests for Main SwiftParserOSS class
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import SwiftParserOSS from '../../src/index.js';
import { VALID_MT103, VALID_MT202, COBOL_SAMPLE } from '../fixtures/swift-messages.js';
import { 
  BANCS_JSON_SAMPLE, 
  FIS_JSON_SAMPLE, 
  TEMENOS_JSON_SAMPLE,
  ISO20022_PACS008_SAMPLE
} from '../fixtures/banking-messages.js';

describe('SwiftParserOSS', () => {
  let parser;

  beforeEach(() => {
    parser = new SwiftParserOSS();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(parser.config).toBeDefined();
      expect(parser.config.enableLogging).toBe(true);
      expect(parser.config.strictValidation).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customParser = new SwiftParserOSS({
        enableLogging: false,
        strictValidation: false
      });
      
      expect(customParser.config.enableLogging).toBe(false);
      expect(customParser.config.strictValidation).toBe(false);
    });

    test('should initialize all parsers', () => {
      expect(parser.swift).toBeDefined();
      expect(parser.enhanced).toBeDefined();
      expect(parser.bancs).toBeDefined();
      expect(parser.fis).toBeDefined();
      expect(parser.fiserv).toBeDefined();
      expect(parser.temenos).toBeDefined();
      expect(parser.iso20022).toBeDefined();
    });
  });

  describe('parse() method', () => {
    test('should parse MT103 message', () => {
      const result = parser.parse(VALID_MT103);
      
      expect(result.messageType).toBe('MT103');
      expect(result.transactionReference).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(result.currency).toBeDefined();
    });

    test('should parse MT202 message', () => {
      const result = parser.parse(VALID_MT202);
      
      expect(result.messageType).toBe('MT202');
      expect(result.transactionReference).toBeDefined();
      expect(result.amount).toBeDefined();
    });

    test('should parse ISO20022 message', () => {
      const result = parser.parse(ISO20022_PACS008_SAMPLE);
      
      expect(result.messageType).toBe('pacs.008');
      expect(result.groupHeader).toBeDefined();
    });

    test('should parse BANCS JSON message', () => {
      const result = parser.parse(JSON.stringify(BANCS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('BANCS_JSON');
      expect(result.transactionId).toBe('TXN456789012');
    });

    test('should parse FIS JSON message', () => {
      const result = parser.parse(JSON.stringify(FIS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('FIS_JSON');
      expect(result.transactionId).toBe('TXN987654321');
    });

    test('should parse Temenos JSON message', () => {
      const result = parser.parse(JSON.stringify(TEMENOS_JSON_SAMPLE));
      
      expect(result.messageType).toBe('TEMENOS_JSON');
      expect(result.header.messageId).toBe('TMN123456789');
    });

    test('should parse BANCS XML message', () => {
      const result = parser.parse(BANCS_XML_SAMPLE, 'BANCS_XML');
      
      expect(result.messageType).toBe('BANCS_XML');
      expect(result.transactionId).toBe('TXN789012345');
    });

    test('should parse BANCS flat file message', () => {
      const result = parser.parse(BANCS_FLAT_SAMPLE, 'BANCS_FLAT');
      
      expect(result.messageType).toBe('BANCS_FLAT');
      expect(result.transactionId).toBe('TXN123456789');
    });

    test('should parse FIS fixed width message', () => {
      const result = parser.parse(FIS_FIXED_WIDTH_SAMPLE, 'FIS_FIXED');
      
      expect(result.messageType).toBe('FIS_FIXED');
      expect(result.transactionId).toBe('TXN123456789');
    });

    test('should parse Fiserv DNA message', () => {
      const result = parser.parse(JSON.stringify(FISERV_DNA_SAMPLE), 'FISERV_DNA');
      
      expect(result.messageType).toBe('FISERV_DNA');
      expect(result.transactionId).toBe('DNA123456789');
    });

    test('should parse Temenos XML message', () => {
      const result = parser.parse(TEMENOS_XML_SAMPLE, 'TEMENOS_XML');
      
      expect(result.messageType).toBe('TEMENOS_XML');
      expect(result.transactionReference).toBe('TMN123456789');
    });

    test('should parse Temenos T24 message', () => {
      const result = parser.parse(TEMENOS_T24_SAMPLE, 'TEMENOS_T24');
      
      expect(result.messageType).toBe('TEMENOS_T24');
      expect(result.transactionReference).toBe('TMN123456789');
    });

    test('should detect COBOL and throw enterprise error', () => {
      expect(() => parser.parse(COBOL_SAMPLE))
        .toThrow('COBOL parsing requires SwiftParser Enterprise');
    });

    test('should throw error for unsupported format', () => {
      expect(() => parser.parse('unsupported message format'))
        .toThrow('Unsupported message format');
    });

    test('should throw error for null input', () => {
      expect(() => parser.parse(null))
        .toThrow('Invalid input: message cannot be null or undefined');
    });

    test('should throw error for undefined input', () => {
      expect(() => parser.parse(undefined))
        .toThrow('Invalid input: message cannot be null or undefined');
    });

    test('should throw error for empty string', () => {
      expect(() => parser.parse(''))
        .toThrow('Invalid input: message cannot be empty');
    });

    test('should throw error for non-string input', () => {
      expect(() => parser.parse(123))
        .toThrow('Invalid input: message must be a string');
    });
  });

  describe('parseWithFormat() method', () => {
    test('should parse with explicit format', () => {
      const result = parser.parseWithFormat(VALID_MT103, 'MT103');
      
      expect(result.messageType).toBe('MT103');
      expect(result.transactionReference).toBeDefined();
    });

    test('should throw error for format mismatch', () => {
      expect(() => parser.parseWithFormat(VALID_MT103, 'MT202'))
        .toThrow();
    });

    test('should throw error for unsupported format', () => {
      expect(() => parser.parseWithFormat(VALID_MT103, 'UNSUPPORTED'))
        .toThrow('Unsupported format: UNSUPPORTED');
    });
  });

  describe('detectFormat() method', () => {
    test('should detect MT103 format', () => {
      const format = parser.detectFormat(VALID_MT103);
      expect(format).toBe('MT103');
    });

    test('should detect MT202 format', () => {
      const format = parser.detectFormat(VALID_MT202);
      expect(format).toBe('MT202');
    });

    test('should detect ISO20022 format', () => {
      const format = parser.detectFormat(ISO20022_PACS008_SAMPLE);
      expect(format).toBe('ISO20022');
    });

    test('should detect BANCS JSON format', () => {
      const format = parser.detectFormat(JSON.stringify(BANCS_JSON_SAMPLE));
      expect(format).toBe('BANCS_JSON');
    });

    test('should detect FIS JSON format', () => {
      const format = parser.detectFormat(JSON.stringify(FIS_JSON_SAMPLE));
      expect(format).toBe('FIS_JSON');
    });

    test('should detect Temenos JSON format', () => {
      const format = parser.detectFormat(JSON.stringify(TEMENOS_JSON_SAMPLE));
      expect(format).toBe('TEMENOS_JSON');
    });

    test('should detect COBOL format', () => {
      const format = parser.detectFormat(COBOL_SAMPLE);
      expect(format).toBe('COBOL');
    });

    test('should return UNKNOWN for unrecognized format', () => {
      const format = parser.detectFormat('unrecognized message');
      expect(format).toBe('UNKNOWN');
    });

    test('should handle null and undefined inputs', () => {
      expect(parser.detectFormat(null)).toBe('UNKNOWN');
      expect(parser.detectFormat(undefined)).toBe('UNKNOWN');
      expect(parser.detectFormat('')).toBe('UNKNOWN');
    });

    test('should detect various MT message types', () => {
      const mt202Message = VALID_MT202;
      expect(parser.detectFormat(mt202Message)).toBe('MT202');
    });
  });

  describe('getSupportedFormats() method', () => {
    test('should return list of supported formats', () => {
      const formats = parser.getSupportedFormats();
      
      expect(formats).toContain('MT103');
      expect(formats).toContain('MT202');
      expect(formats).toContain('ISO20022');
      expect(formats).toContain('BANCS_JSON');
      expect(formats).toContain('FIS_JSON');
      expect(formats).toContain('TEMENOS_JSON');
    });

    test('should return a copy of the array', () => {
      const formats1 = parser.getSupportedFormats();
      const formats2 = parser.getSupportedFormats();
      
      expect(formats1).not.toBe(formats2);
      expect(formats1).toEqual(formats2);
    });
  });

  describe('validate() method', () => {
    test('should validate MT103 message', () => {
      const isValid = parser.validate(VALID_MT103);
      expect(isValid).toBe(true);
    });

    test('should validate MT202 message', () => {
      const isValid = parser.validate(VALID_MT202);
      expect(isValid).toBe(true);
    });

    test('should validate ISO20022 message', () => {
      const isValid = parser.validate(ISO20022_PACS008_SAMPLE);
      expect(isValid).toBe(true);
    });

    test('should return false for invalid message', () => {
      const isValid = parser.validate('invalid message');
      expect(isValid).toBe(false);
    });

    test('should return false for null message', () => {
      const isValid = parser.validate(null);
      expect(isValid).toBe(false);
    });
  });

  describe('toJSON() method', () => {
    test('should convert parsed message to JSON string', () => {
      const result = parser.parse(VALID_MT103);
      const json = parser.toJSON(result);
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.messageType).toBe('MT103');
    });

    test('should handle null input', () => {
      const json = parser.toJSON(null);
      expect(json).toBe('null');
    });
  });

  describe('Enterprise features', () => {
    test('should throw error for COBOL transpilation', () => {
      expect(() => parser.transpileCOBOL(COBOL_SAMPLE))
        .toThrow('COBOL transpilation requires SwiftParser Enterprise');
    });

    test('should throw error for blockchain conversion', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.convertToBlockchain(result))
        .toThrow('Blockchain conversion requires SwiftParser Enterprise');
    });

    test('should throw error for compliance extraction', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.extractCompliance(result))
        .toThrow('Compliance extraction requires SwiftParser Enterprise');
    });

    test('should throw error for smart routing', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.routeMessage(result))
        .toThrow('Smart routing requires SwiftParser Enterprise');
    });
  });

  describe('Batch processing', () => {
    test('should process multiple messages', () => {
      const messages = [VALID_MT103, VALID_MT202];
      const results = parser.batchParse(messages);
      
      expect(results).toHaveLength(2);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].messageType).toBe('MT202');
    });

    test('should handle mixed message types', () => {
      const messages = [
        VALID_MT103,
        JSON.stringify(BANCS_JSON_SAMPLE),
        ISO20022_PACS008_SAMPLE
      ];
      const results = parser.batchParse(messages);
      
      expect(results).toHaveLength(3);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].messageType).toBe('BANCS_JSON');
      expect(results[2].messageType).toBe('pacs.008');
    });

    test('should handle errors in batch processing', () => {
      const messages = [VALID_MT103, 'invalid message'];
      const results = parser.batchParse(messages);
      
      expect(results).toHaveLength(2);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].error).toBeDefined();
    });
  });

  describe('Performance metrics', () => {
    test('should track parsing metrics', () => {
      const initialMetrics = parser.getMetrics();
      
      parser.parse(VALID_MT103);
      
      const updatedMetrics = parser.getMetrics();
      expect(updatedMetrics.totalParsed).toBe(initialMetrics.totalParsed + 1);
      expect(updatedMetrics.successfulParses).toBe(initialMetrics.successfulParses + 1);
    });

    test('should track failed parsing attempts', () => {
      const initialMetrics = parser.getMetrics();
      
      try {
        parser.parse('invalid message');
      } catch (error) {
        // Expected error
      }
      
      const updatedMetrics = parser.getMetrics();
      expect(updatedMetrics.totalParsed).toBe(initialMetrics.totalParsed + 1);
      expect(updatedMetrics.failedParses).toBe(initialMetrics.failedParses + 1);
    });
  });
});