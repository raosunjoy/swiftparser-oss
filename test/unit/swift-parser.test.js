/**
 * Unit tests for SWIFT Parser
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import SWIFTParser from '../../src/parsers/swift/base-parser.js';
import { 
  VALID_MT103, 
  VALID_MT202, 
  INVALID_SWIFT_MISSING_HEADER, 
  INVALID_SWIFT_MISSING_REQUIRED_FIELDS 
} from '../fixtures/swift-messages.js';

describe('SWIFTParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SWIFTParser();
  });

  describe('Constructor', () => {
    test('should initialize with supported message types', () => {
      expect(parser.supportedMessageTypes).toEqual(['MT103', 'MT202']);
    });

    test('should initialize logger', () => {
      expect(parser).toBeDefined();
    });
  });

  describe('parse() method', () => {
    test('should successfully parse valid MT103 message', () => {
      const result = parser.parse(VALID_MT103);
      
      expect(result).toBeDefined();
      expect(result.messageType).toBe('MT103');
      expect(result.transactionReference).toBe('123456789');
      expect(result.amount).toBe(100000);
      expect(result.currency).toBe('USD');
      expect(result.valueDate).toBe('2023-07-01');
      expect(result.sender.account).toBe('/12345678');
      expect(result.sender.name).toBe('SENDER BANK NAME');
      expect(result.receiver.account).toBe('/98765432');
      expect(result.receiver.name).toBe('BENEFICIARY NAME');
    });

    test('should successfully parse valid MT202 message', () => {
      const result = parser.parse(VALID_MT202);
      
      expect(result).toBeDefined();
      expect(result.messageType).toBe('MT202');
      expect(result.transactionReference).toBe('202123456789');
      expect(result.amount).toBe(500000);
      expect(result.currency).toBe('USD');
      expect(result.orderingInstitution).toBe('AAAAGRA0');
      expect(result.beneficiaryInstitution).toBe('CCCCUSD0');
    });

    test('should throw error for null message', () => {
      expect(() => parser.parse(null)).toThrow('Invalid message format: message must be a non-empty string');
    });

    test('should throw error for empty string', () => {
      expect(() => parser.parse('')).toThrow('Invalid message format: message must be a non-empty string');
    });

    test('should throw error for non-string input', () => {
      expect(() => parser.parse(123)).toThrow('Invalid message format: message must be a non-empty string');
    });

    test('should throw error for message missing header', () => {
      expect(() => parser.parse(INVALID_SWIFT_MISSING_HEADER)).toThrow('Invalid SWIFT message format: missing application header');
    });

    test('should throw error for unsupported message type', () => {
      const unsupportedMessage = '{1:F01AAAAGRA0AXXX1234123456}{2:I999BBBBGRB0XXXXN}{4::20:123-}';
      expect(() => parser.parse(unsupportedMessage)).toThrow('Unsupported message type: MT999');
    });

    test('should throw error for missing required fields', () => {
      expect(() => parser.parse(INVALID_SWIFT_MISSING_REQUIRED_FIELDS)).toThrow(/Missing required field/);
    });
  });

  describe('extractMessageType() method', () => {
    test('should extract MT103 from valid message', () => {
      const messageType = parser.extractMessageType(VALID_MT103);
      expect(messageType).toBe('MT103');
    });

    test('should extract MT202 from valid message', () => {
      const messageType = parser.extractMessageType(VALID_MT202);
      expect(messageType).toBe('MT202');
    });

    test('should throw error for invalid header format', () => {
      expect(() => parser.extractMessageType('invalid message')).toThrow('Invalid SWIFT message format: missing application header');
    });
  });

  describe('parseFields() method', () => {
    test('should parse fields from MT103 message', () => {
      const fields = parser.parseFields(VALID_MT103, 'MT103');
      
      expect(fields['20']).toBeDefined();
      expect(fields['20'].content).toBe('123456789');
      expect(fields['32A']).toBeDefined();
      expect(fields['50K']).toBeDefined();
      expect(fields['59']).toBeDefined();
    });

    test('should throw error for message without text block', () => {
      const invalidMessage = '{1:F01AAAAGRA0AXXX1234123456}{2:I103BBBBGRB0XXXXN}';
      expect(() => parser.parseFields(invalidMessage, 'MT103')).toThrow('Invalid SWIFT message format: missing text block');
    });

    test('should throw error for message without valid fields', () => {
      const invalidMessage = '{1:F01AAAAGRA0AXXX1234123456}{2:I103BBBBGRB0XXXXN}{4:invalid-}';
      expect(() => parser.parseFields(invalidMessage, 'MT103')).toThrow('No valid fields found in message');
    });
  });

  describe('validateRequiredFields() method', () => {
    test('should pass validation for MT103 with all required fields', () => {
      const fields = parser.parseFields(VALID_MT103, 'MT103');
      expect(() => parser.validateRequiredFields(fields, 'MT103')).not.toThrow();
    });

    test('should fail validation for MT103 missing required field', () => {
      const fields = { '20': { content: '123' } }; // Missing other required fields
      expect(() => parser.validateRequiredFields(fields, 'MT103')).toThrow(/Missing required field/);
    });
  });

  describe('parseAmountField() method', () => {
    test('should parse valid amount field', () => {
      const result = parser.parseAmountField('230701USD100000');
      
      expect(result.valueDate).toBe('2023-07-01');
      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(100000);
    });

    test('should parse amount with commas', () => {
      const result = parser.parseAmountField('230701EUR10000.50');
      
      expect(result.amount).toBe(10000.5);
      expect(result.currency).toBe('EUR');
    });

    test('should throw error for invalid amount format', () => {
      expect(() => parser.parseAmountField('invalid')).toThrow('Invalid amount field format: invalid');
    });
  });

  describe('parseCustomerInfo() method', () => {
    test('should parse customer info with account and name', () => {
      const content = '/12345678\nCUSTOMER NAME\nADDRESS LINE';
      const result = parser.parseCustomerInfo(content);
      
      expect(result.account).toBe('/12345678');
      expect(result.name).toBe('CUSTOMER NAME');
      expect(result.address).toBe('ADDRESS LINE');
    });

    test('should return null for empty content', () => {
      const result = parser.parseCustomerInfo(null);
      expect(result).toBeNull();
    });

    test('should handle single line content', () => {
      const result = parser.parseCustomerInfo('/12345678');
      expect(result.account).toBe('/12345678');
      expect(result.name).toBeNull();
    });
  });

  describe('validateBIC() method', () => {
    test('should validate correct 8-character BIC', () => {
      expect(parser.validateBIC('DEUTDEFF')).toBe(true);
    });

    test('should validate correct 11-character BIC', () => {
      expect(parser.validateBIC('DEUTDEFF500')).toBe(true);
    });

    test('should reject invalid BIC length', () => {
      expect(parser.validateBIC('DEUT')).toBe(false);
      expect(parser.validateBIC('DEUTDEFF5001')).toBe(false);
    });

    test('should reject invalid BIC format', () => {
      expect(parser.validateBIC('12345678')).toBe(false);
      expect(parser.validateBIC('DEUT123')).toBe(false);
    });

    test('should reject null or undefined BIC', () => {
      expect(parser.validateBIC(null)).toBe(false);
      expect(parser.validateBIC(undefined)).toBe(false);
    });

    test('should reject non-string BIC', () => {
      expect(parser.validateBIC(12345678)).toBe(false);
    });
  });

  describe('getSupportedTypes() method', () => {
    test('should return array of supported message types', () => {
      const types = parser.getSupportedTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('MT103');
      expect(types).toContain('MT202');
    });

    test('should return a copy of the array', () => {
      const types1 = parser.getSupportedTypes();
      const types2 = parser.getSupportedTypes();
      expect(types1).not.toBe(types2); // Different array instances
      expect(types1).toEqual(types2); // Same content
    });
  });

  describe('toJSON() method', () => {
    test('should convert parsed message to JSON string', () => {
      const result = parser.parse(VALID_MT103);
      const json = parser.toJSON(result);
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.messageType).toBe('MT103');
      expect(parsed.transactionReference).toBe('123456789');
    });
  });

  describe('createStandardizedMessage() method', () => {
    test('should create message with UUID', () => {
      const fields = parser.parseFields(VALID_MT103, 'MT103');
      const message = parser.createStandardizedMessage(fields, 'MT103');
      
      expect(message.id).toBeDefined();
      expect(typeof message.id).toBe('string');
      expect(message.id.length).toBe(36); // UUID length
    });

    test('should include timestamp', () => {
      const fields = parser.parseFields(VALID_MT103, 'MT103');
      const message = parser.createStandardizedMessage(fields, 'MT103');
      
      expect(message.timestamp).toBeDefined();
      expect(new Date(message.timestamp)).toBeInstanceOf(Date);
    });

    test('should set status to parsed', () => {
      const fields = parser.parseFields(VALID_MT103, 'MT103');
      const message = parser.createStandardizedMessage(fields, 'MT103');
      
      expect(message.status).toBe('parsed');
    });
  });

  describe('getRequiredFields() method', () => {
    test('should return required fields for MT103', () => {
      const required = parser.getRequiredFields('MT103');
      expect(required).toEqual(['20', '32A', '50K', '59']);
    });

    test('should return required fields for MT202', () => {
      const required = parser.getRequiredFields('MT202');
      expect(required).toEqual(['20', '32A', '52A', '58A']);
    });

    test('should return empty array for unknown message type', () => {
      const required = parser.getRequiredFields('UNKNOWN');
      expect(required).toEqual([]);
    });
  });
});