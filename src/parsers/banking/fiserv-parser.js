/**
 * Fiserv DNA Format Parser
 * Open-Source Implementation (Apache 2.0 License)
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'fiserv-parser' }
});

export default class FiservParser {
  constructor() {
    this.supportedSystems = ['DNA'];
    this.supportedFormats = ['JSON'];
  }

  detectFormat(message) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.transactionId && parsed.transactionId.startsWith('DNA')) {
        return 'DNA';
      }
    } catch (e) {
      // Not JSON
    }
    
    return 'UNKNOWN';
  }

  parseDNA(jsonMessage) {
    try {
      const data = JSON.parse(jsonMessage);
      
      if (!data.transactionId || !data.transactionId.startsWith('DNA')) {
        throw new Error('Invalid Fiserv DNA JSON: missing or invalid transactionId');
      }
      
      return {
        messageType: 'FISERV_DNA',
        transactionId: data.transactionId,
        accountNumber: data.accountNumber,
        amount: data.amount,
        currency: data.currency,
        valueDate: data.valueDate,
        description: data.description,
        customerName: data.customerName,
        branchCode: data.branchCode,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'FISERV',
          format: 'DNA'
        }
      };
    } catch (error) {
      logger.error('Fiserv DNA parsing failed', { error: error.message });
      throw new Error(`Fiserv DNA parsing failed: ${error.message}`);
    }
  }
}