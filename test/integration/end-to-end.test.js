/**
 * Integration tests for end-to-end scenarios
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import SwiftParserOSS from '../../src/index.js';
import { 
  VALID_MT103, 
  VALID_MT202, 
  COBOL_SAMPLE, 
  EXPECTED_MT103_PARSED 
} from '../fixtures/swift-messages.js';
import { 
  BANCS_JSON_SAMPLE, 
  FIS_JSON_SAMPLE, 
  TEMENOS_JSON_SAMPLE,
  ISO20022_PACS008_SAMPLE
} from '../fixtures/banking-messages.js';

describe('End-to-End Integration Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new SwiftParserOSS({
      enableLogging: true,
      strictValidation: true
    });
  });

  describe('Complete parsing workflows', () => {
    test('should parse MT103 message end-to-end', () => {
      // Step 1: Detect format
      const format = parser.detectFormat(VALID_MT103);
      expect(format).toBe('MT103');
      
      // Step 2: Validate message
      const isValid = parser.validate(VALID_MT103);
      expect(isValid).toBe(true);
      
      // Step 3: Parse message
      const result = parser.parse(VALID_MT103);
      expect(result.messageType).toBe('MT103');
      expect(result.transactionReference).toBe('123456789');
      
      // Step 4: Convert to JSON
      const json = parser.toJSON(result);
      expect(typeof json).toBe('string');
      
      // Step 5: Verify JSON structure
      const parsed = JSON.parse(json);
      expect(parsed.messageType).toBe('MT103');
    });

    test('should handle multi-format batch processing', () => {
      const messages = [
        VALID_MT103,
        VALID_MT202,
        JSON.stringify(BANCS_JSON_SAMPLE),
        JSON.stringify(FIS_JSON_SAMPLE),
        JSON.stringify(TEMENOS_JSON_SAMPLE),
        ISO20022_PACS008_SAMPLE
      ];
      
      const results = parser.batchParse(messages);
      
      expect(results).toHaveLength(6);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].messageType).toBe('MT202');
      expect(results[2].messageType).toBe('BANCS_JSON');
      expect(results[3].messageType).toBe('FIS_JSON');
      expect(results[4].messageType).toBe('TEMENOS_JSON');
      expect(results[5].messageType).toBe('pacs.008');
    });

    test('should maintain consistent output structure across formats', () => {
      const messages = [
        VALID_MT103,
        JSON.stringify(BANCS_JSON_SAMPLE),
        ISO20022_PACS008_SAMPLE
      ];
      
      const results = parser.batchParse(messages);
      
      // All results should have consistent metadata structure
      results.forEach(result => {
        expect(result.messageType).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(result.parseMetadata).toBeDefined();
        expect(result.parseMetadata.parseId).toBeDefined();
      });
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle mixed valid and invalid messages', () => {
      const messages = [
        VALID_MT103,
        'invalid message 1',
        VALID_MT202,
        'invalid message 2',
        JSON.stringify(BANCS_JSON_SAMPLE)
      ];
      
      const results = parser.batchParse(messages);
      
      expect(results).toHaveLength(5);
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].error).toBeDefined();
      expect(results[2].messageType).toBe('MT202');
      expect(results[3].error).toBeDefined();
      expect(results[4].messageType).toBe('BANCS_JSON');
    });

    test('should maintain metrics across failed parsing attempts', () => {
      const initialMetrics = parser.getMetrics();
      
      // Parse some valid messages
      parser.parse(VALID_MT103);
      parser.parse(VALID_MT202);
      
      // Try to parse invalid messages
      try {
        parser.parse('invalid message 1');
      } catch (e) { /* expected */ }
      
      try {
        parser.parse('invalid message 2');
      } catch (e) { /* expected */ }
      
      const finalMetrics = parser.getMetrics();
      
      expect(finalMetrics.totalParsed).toBe(initialMetrics.totalParsed + 4);
      expect(finalMetrics.successfulParses).toBe(initialMetrics.successfulParses + 2);
      expect(finalMetrics.failedParses).toBe(initialMetrics.failedParses + 2);
    });
  });

  describe('Performance and scalability', () => {
    test('should handle large batch processing efficiently', () => {
      const messages = Array(100).fill(VALID_MT103);
      
      const startTime = process.hrtime.bigint();
      const results = parser.batchParse(messages);
      const endTime = process.hrtime.bigint();
      
      const processingTime = Number((endTime - startTime) / BigInt(1000000)); // Convert to milliseconds
      
      expect(results).toHaveLength(100);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All results should be successful
      results.forEach(result => {
        expect(result.messageType).toBe('MT103');
        expect(result.error).toBeUndefined();
      });
    });

    test('should maintain consistent performance across different formats', () => {
      const testCases = [
        { format: 'MT103', message: VALID_MT103 },
        { format: 'MT202', message: VALID_MT202 },
        { format: 'BANCS_JSON', message: JSON.stringify(BANCS_JSON_SAMPLE) },
        { format: 'FIS_JSON', message: JSON.stringify(FIS_JSON_SAMPLE) },
        { format: 'ISO20022', message: ISO20022_PACS008_SAMPLE }
      ];
      
      const performanceResults = {};
      
      testCases.forEach(({ format, message }) => {
        const startTime = process.hrtime.bigint();
        const result = parser.parse(message);
        const endTime = process.hrtime.bigint();
        
        const processingTime = Number((endTime - startTime) / BigInt(1000000));
        performanceResults[format] = processingTime;
        
        expect(result.messageType).toBe(format);
      });
      
      // All formats should parse within reasonable time
      Object.values(performanceResults).forEach(time => {
        expect(time).toBeLessThan(100); // Should complete within 100ms each
      });
    });
  });

  describe('Data integrity and validation', () => {
    test('should preserve all critical data fields during parsing', () => {
      const result = parser.parse(VALID_MT103);
      
      // Verify all expected fields from fixture are present
      expect(result.messageType).toBe(EXPECTED_MT103_PARSED.messageType);
      expect(result.transactionReference).toBe(EXPECTED_MT103_PARSED.transactionReference);
      expect(result.currency).toBe(EXPECTED_MT103_PARSED.currency);
      expect(result.valueDate).toBe(EXPECTED_MT103_PARSED.valueDate);
      expect(result.sender.account).toBe(EXPECTED_MT103_PARSED.sender.account);
      expect(result.sender.name).toBe(EXPECTED_MT103_PARSED.sender.name);
      expect(result.receiver.account).toBe(EXPECTED_MT103_PARSED.receiver.account);
      expect(result.receiver.name).toBe(EXPECTED_MT103_PARSED.receiver.name);
    });

    test('should validate data types and ranges', () => {
      const result = parser.parse(VALID_MT103);
      
      expect(typeof result.transactionReference).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.currency).toBe('string');
      expect(typeof result.valueDate).toBe('string');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.currency).toMatch(/^[A-Z]{3}$/);
    });

    test('should handle round-trip conversion correctly', () => {
      const originalResult = parser.parse(VALID_MT103);
      const json = parser.toJSON(originalResult);
      const parsedBack = JSON.parse(json);
      
      expect(parsedBack.messageType).toBe(originalResult.messageType);
      expect(parsedBack.transactionReference).toBe(originalResult.transactionReference);
      expect(parsedBack.amount).toBe(originalResult.amount);
      expect(parsedBack.currency).toBe(originalResult.currency);
    });
  });

  describe('Enterprise feature boundaries', () => {
    test('should properly redirect to enterprise for COBOL', () => {
      expect(() => parser.parse(COBOL_SAMPLE))
        .toThrow('COBOL parsing requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
    });

    test('should properly redirect to enterprise for blockchain conversion', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.convertToBlockchain(result))
        .toThrow('Blockchain conversion requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
    });

    test('should properly redirect to enterprise for compliance extraction', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.extractCompliance(result))
        .toThrow('Compliance extraction requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
    });

    test('should properly redirect to enterprise for smart routing', () => {
      const result = parser.parse(VALID_MT103);
      expect(() => parser.routeMessage(result))
        .toThrow('Smart routing requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle typical banking workflow', () => {
      // Simulate a typical banking message processing workflow
      const messages = [
        VALID_MT103,  // Cross-border payment
        VALID_MT202,  // Bank-to-bank transfer
        JSON.stringify(BANCS_JSON_SAMPLE),  // Core banking transaction
        ISO20022_PACS008_SAMPLE  // Modern payment message
      ];
      
      // Step 1: Validate all messages
      const validationResults = messages.map(msg => parser.validate(msg));
      expect(validationResults).toEqual([true, true, true, true]);
      
      // Step 2: Parse all messages
      const parseResults = parser.batchParse(messages);
      expect(parseResults).toHaveLength(4);
      
      // Step 3: Verify all were parsed successfully
      parseResults.forEach(result => {
        expect(result.error).toBeUndefined();
        expect(result.messageType).toBeDefined();
      });
      
      // Step 4: Extract key financial data
      const totalAmount = parseResults.reduce((sum, result) => {
        return sum + (result.amount || 0);
      }, 0);
      
      expect(totalAmount).toBeGreaterThan(0);
    });

    test('should handle multi-system integration scenario', () => {
      // Simulate messages from different banking systems
      const systemMessages = [
        { system: 'SWIFT', message: VALID_MT103 },
        { system: 'BANCS', message: JSON.stringify(BANCS_JSON_SAMPLE) },
        { system: 'FIS', message: JSON.stringify(FIS_JSON_SAMPLE) },
        { system: 'TEMENOS', message: JSON.stringify(TEMENOS_JSON_SAMPLE) },
        { system: 'ISO20022', message: ISO20022_PACS008_SAMPLE }
      ];
      
      const results = systemMessages.map(({ system, message }) => {
        const result = parser.parse(message);
        result.sourceSystem = system;
        return result;
      });
      
      expect(results).toHaveLength(5);
      
      // Verify each system's message was parsed correctly
      expect(results[0].messageType).toBe('MT103');
      expect(results[1].messageType).toBe('BANCS_JSON');
      expect(results[2].messageType).toBe('FIS_JSON');
      expect(results[3].messageType).toBe('TEMENOS_JSON');
      expect(results[4].messageType).toBe('pacs.008');
    });
  });
});