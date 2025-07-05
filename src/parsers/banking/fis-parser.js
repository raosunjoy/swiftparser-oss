/**
 * FIS Systematics Format Parser
 * Open-Source Implementation (Apache 2.0 License)
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'fis-parser' }
});

export default class FISParser {
  constructor() {
    this.supportedFormats = ['FIXED_WIDTH', 'JSON', 'DELIMITED'];
  }

  detectFormat(message) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.transactionId && parsed.accountNumber) {
        return 'JSON';
      }
    } catch (e) {
      // Not JSON
    }
    
    if (message.includes('|') && message.split('|').length > 5) {
      return 'DELIMITED';
    }
    
    if (message.length > 100 && message.substring(0, 2).match(/^\d{2}$/)) {
      return 'FIXED_WIDTH';
    }
    
    return 'UNKNOWN';
  }

  parseFixedWidth(fixedWidthMessage) {
    try {
      if (fixedWidthMessage.length < 100) {
        throw new Error('Invalid FIS fixed width: message too short');
      }
      
      const recordType = fixedWidthMessage.substring(0, 2);
      const transactionId = fixedWidthMessage.substring(2, 17).trim();
      const accountNumber = fixedWidthMessage.substring(17, 32).trim();
      const amountStr = fixedWidthMessage.substring(32, 41).trim();
      const currency = fixedWidthMessage.substring(41, 44).trim();
      const valueDate = fixedWidthMessage.substring(44, 52).trim();
      const transactionType = fixedWidthMessage.substring(52, 55).trim();
      const description = fixedWidthMessage.substring(55, 100).trim();
      const customerName = fixedWidthMessage.substring(100, 150).trim();
      const branchCode = fixedWidthMessage.substring(150, 154).trim();
      
      return {
        messageType: 'FIS_FIXED',
        recordType,
        transactionId,
        accountNumber,
        amount: parseFloat(amountStr) / 100, // Convert from cents
        currency,
        valueDate,
        transactionType,
        description,
        customerName,
        branchCode,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'FIS',
          format: 'FIXED_WIDTH'
        }
      };
    } catch (error) {
      logger.error('FIS fixed width parsing failed', { error: error.message });
      throw new Error(`FIS fixed width parsing failed: ${error.message}`);
    }
  }

  parseJSON(jsonMessage) {
    try {
      const data = JSON.parse(jsonMessage);
      
      if (!data.transactionId) {
        throw new Error('Invalid FIS JSON: missing transactionId');
      }
      
      return {
        messageType: 'FIS_JSON',
        transactionId: data.transactionId,
        accountNumber: data.accountNumber,
        amount: data.amount,
        currency: data.currency,
        valueDate: data.valueDate,
        transactionType: data.transactionType,
        description: data.description,
        customerName: data.customerName,
        branchCode: data.branchCode,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'FIS',
          format: 'JSON'
        }
      };
    } catch (error) {
      logger.error('FIS JSON parsing failed', { error: error.message });
      throw new Error(`FIS JSON parsing failed: ${error.message}`);
    }
  }

  parseDelimited(delimitedMessage) {
    try {
      const fields = delimitedMessage.split('|');
      
      if (fields.length < 8) {
        throw new Error('Invalid FIS delimited: insufficient fields');
      }
      
      return {
        messageType: 'FIS_DELIMITED',
        transactionId: fields[0],
        accountNumber: fields[1],
        amount: parseFloat(fields[2]),
        currency: fields[3],
        valueDate: fields[4],
        transactionType: fields[5],
        description: fields[6],
        customerName: fields[7],
        branchCode: fields[8] || '',
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'FIS',
          format: 'DELIMITED'
        }
      };
    } catch (error) {
      logger.error('FIS delimited parsing failed', { error: error.message });
      throw new Error(`FIS delimited parsing failed: ${error.message}`);
    }
  }
}