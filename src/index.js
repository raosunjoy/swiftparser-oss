/**
 * SwiftParser-OSS
 * Main entry point
 */

import SwiftParser from './parsers/swift/base-parser.js';
import EnhancedSwiftParser from './parsers/swift/enhanced-parser.js';
import BANCSParser from './parsers/banking/bancs-parser.js';
import FISParser from './parsers/banking/fis-parser.js';
import FiservParser from './parsers/banking/fiserv-parser.js';
import TemenosParser from './parsers/banking/temenos-parser.js';
import ISO20022Parser from './parsers/iso20022/pacs008-parser.js';
import { detectCOBOL, parseCOBOL } from './parsers/additional/cobol-stub.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'swiftparser-oss' }
});

export {
  SwiftParser,
  EnhancedSwiftParser,
  BANCSParser,
  FISParser,
  FiservParser,
  TemenosParser,
  ISO20022Parser,
  detectCOBOL,
  parseCOBOL
};

export default class SwiftParserOSS {
  constructor(config = {}) {
    this.config = {
      enableLogging: config.enableLogging !== false,
      strictValidation: config.strictValidation !== false,
      ...config
    };
    
    this.swift = new SwiftParser();
    this.enhanced = new EnhancedSwiftParser();
    this.bancs = new BANCSParser();
    this.fis = new FISParser();
    this.fiserv = new FiservParser();
    this.temenos = new TemenosParser();
    this.iso20022 = new ISO20022Parser();
    
    this.metrics = {
      totalParsed: 0,
      successfulParses: 0,
      failedParses: 0
    };
  }
  
  parse(message, format) {
    const startTime = process.hrtime.bigint();
    this.metrics.totalParsed++;

    try {
      // Input validation
      if (message === null || message === undefined) {
        throw new Error('Invalid input: message cannot be null or undefined');
      }

      if (typeof message !== 'string') {
        throw new Error('Invalid input: message must be a string');
      }

      if (message.trim() === '') {
        throw new Error('Invalid input: message cannot be empty');
      }

      // Auto-detect format if not provided
      const detectedFormat = format || this.detectFormat(message);
      
      // Route to appropriate parser
      let result;
      const formatUpper = detectedFormat.toUpperCase();
      
      if (formatUpper.startsWith('MT')) {
        result = this.swift.parse(message);
      } else if (formatUpper === 'ISO20022' || formatUpper === 'PACS.008') {
        result = this.iso20022.parsePacs008(message);
      } else if (formatUpper.includes('BANCS')) {
        if (formatUpper.includes('JSON')) {
          result = this.bancs.parseJSON(message);
        } else if (formatUpper.includes('XML')) {
          result = this.bancs.parseXML(message);
        } else {
          result = this.bancs.parseFlat(message);
        }
      } else if (formatUpper.includes('FIS')) {
        if (formatUpper.includes('JSON')) {
          result = this.fis.parseJSON(message);
        } else {
          result = this.fis.parseFixedWidth(message);
        }
      } else if (formatUpper.includes('FISERV') || formatUpper.includes('DNA')) {
        result = this.fiserv.parseDNA(message);
      } else if (formatUpper.includes('TEMENOS')) {
        if (formatUpper.includes('JSON')) {
          result = this.temenos.parseJSON(message);
        } else if (formatUpper.includes('XML')) {
          result = this.temenos.parseXML(message);
        } else {
          result = this.temenos.parseT24(message);
        }
      } else if (detectCOBOL(message)) {
        return parseCOBOL(message);
      } else {
        throw new Error(`Unsupported message format`);
      }

      // Add timing metadata
      result.parseMetadata = result.parseMetadata || {};
      result.parseMetadata.parseTime = Math.max(1, Number((process.hrtime.bigint() - startTime) / BigInt(1000000)));
      result.parseMetadata.timestamp = new Date().toISOString();

      this.metrics.successfulParses++;
      return result;

    } catch (error) {
      this.metrics.failedParses++;
      logger.error('Parsing failed', { 
        error: error.message,
        format: format || 'auto-detect'
      });
      throw error;
    }
  }
  
  detectFormat(message) {
    if (!message || typeof message !== 'string') {
      return 'UNKNOWN';
    }

    // SWIFT message detection
    if (message.includes('{1:') && message.includes('{2:') && message.includes('{4:')) {
      const match = message.match(/\{2:I(\d{3})/);
      if (match) {
        return `MT${match[1]}`;
      }
    }

    // ISO 20022 detection
    if (message.includes('<?xml') && message.includes('urn:iso:std:iso:20022')) {
      return 'ISO20022';
    }

    // BANCS detection
    if (message.includes('<Transaction>') || message.includes('TransactionID')) {
      return 'BANCS_XML';
    }

    // JSON format detection
    try {
      const parsed = JSON.parse(message);
      if (parsed.transactionId) {
        if (parsed.transactionId.startsWith('DNA')) {
          return 'FISERV_DNA';
        }
        if (parsed.transactionId.startsWith('TXN')) {
          // Distinguish between BANCS and FIS JSON by checking for FIS-specific fields
          if (parsed.transactionType && parsed.branchCode) {
            return 'FIS_JSON';
          }
          return 'BANCS_JSON';
        }
      }
      if (parsed.header && parsed.header.messageId && parsed.header.messageId.startsWith('TMN')) {
        return 'TEMENOS_JSON';
      }
    } catch (e) {
      // Not JSON
    }

    // Temenos XML detection
    if (message.includes('<TemenosTransaction>')) {
      return 'TEMENOS_XML';
    }

    // COBOL detection
    if (detectCOBOL(message)) {
      return 'COBOL';
    }

    return 'UNKNOWN';
  }
  
  /**
   * Parse with explicit format specification
   */
  parseWithFormat(message, format) {
    if (!this.getSupportedFormats().includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    // Validate that the message actually matches the specified format
    const detectedFormat = this.detectFormat(message);
    if (detectedFormat !== 'UNKNOWN' && detectedFormat !== format) {
      throw new Error(`Format mismatch: expected ${format} but detected ${detectedFormat}`);
    }
    
    return this.parse(message, format);
  }

  /**
   * Get list of supported formats
   */
  getSupportedFormats() {
    return [
      'MT103', 'MT202', 'MT515', 'MT700', 'MT798', 'MT950', 'MT101',
      'ISO20022', 'BANCS_XML', 'BANCS_JSON', 'BANCS_FLAT',
      'FIS_FIXED', 'FIS_JSON', 'FIS_DELIMITED',
      'FISERV_DNA', 'TEMENOS_JSON', 'TEMENOS_XML', 'TEMENOS_T24'
    ];
  }

  /**
   * Validate message without parsing
   */
  validate(message) {
    try {
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return false;
      }
      
      const format = this.detectFormat(message);
      return format !== 'UNKNOWN';
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert parsed message to JSON string
   */
  toJSON(parsedMessage) {
    return JSON.stringify(parsedMessage);
  }

  /**
   * Get parsing metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Batch parse multiple messages
   */
  batchParse(messages) {
    const results = [];
    
    for (const message of messages) {
      try {
        const result = this.parse(message);
        results.push(result);
      } catch (error) {
        results.push({
          error: error.message,
          originalMessage: message
        });
      }
    }
    
    return results;
  }

  /**
   * Enterprise feature stubs
   */
  transpileCOBOL(message) {
    throw new Error('COBOL transpilation requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
  }

  convertToBlockchain(message) {
    throw new Error('Blockchain conversion requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
  }

  extractCompliance(message) {
    throw new Error('Compliance extraction requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
  }

  routeMessage(message) {
    throw new Error('Smart routing requires SwiftParser Enterprise. Contact enterprise@gridworks.ai');
  }
}
