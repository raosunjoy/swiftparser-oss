/**
 * TCS BaNCS Format Parser
 * Open-Source Implementation (Apache 2.0 License)
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import xml2js from 'xml2js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'bancs-parser' }
});

export default class BANCSParser {
  constructor() {
    this.supportedFormats = ['XML', 'JSON', 'FLAT'];
    this.parser = new xml2js.Parser();
  }

  detectFormat(message) {
    if (message.trim().startsWith('<?xml') || message.trim().startsWith('<Transaction>')) {
      return 'XML';
    }
    
    try {
      const parsed = JSON.parse(message);
      if (parsed.transactionId || parsed.accountNumber) {
        return 'JSON';
      }
    } catch (e) {
      // Not JSON
    }
    
    if (message.includes('TXN') && message.includes('ACC') && message.length > 50) {
      return 'FLAT';
    }
    
    return 'UNKNOWN';
  }

  parseXML(xmlMessage) {
    try {
      // Simple XML parsing for testing - in production would use proper async xml2js
      if (!xmlMessage.includes('<Transaction>')) {
        throw new Error('Invalid BANCS XML: missing Transaction element');
      }
      
      // Extract fields using simple regex (simplified for testing)
      const transactionId = this.extractXMLField(xmlMessage, 'TransactionID');
      const amount = parseFloat(this.extractXMLField(xmlMessage, 'Amount'));
      const currency = this.extractXMLField(xmlMessage, 'Currency');
      const debitAccount = this.extractXMLField(xmlMessage, 'DebitAccount');
      const creditAccount = this.extractXMLField(xmlMessage, 'CreditAccount');
      const description = this.extractXMLField(xmlMessage, 'Description');
      
      return {
        messageType: 'BANCS_XML',
        transactionId,
        amount,
        currency,
        debitAccount,
        creditAccount,
        description,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'BANCS',
          format: 'XML'
        }
      };
    } catch (error) {
      logger.error('BANCS XML parsing failed', { error: error.message });
      throw new Error(`BANCS XML parsing failed: ${error.message}`);
    }
  }

  parseJSON(jsonMessage) {
    try {
      const data = JSON.parse(jsonMessage);
      
      if (!data.transactionId) {
        throw new Error('Invalid BANCS JSON: missing transactionId');
      }
      
      return {
        messageType: 'BANCS_JSON',
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
          parser: 'BANCS',
          format: 'JSON'
        }
      };
    } catch (error) {
      logger.error('BANCS JSON parsing failed', { error: error.message });
      throw new Error(`BANCS JSON parsing failed: ${error.message}`);
    }
  }

  parseFlat(flatMessage) {
    try {
      if (flatMessage.length < 50) {
        throw new Error('Invalid BANCS flat file: message too short');
      }
      
      const transactionId = flatMessage.substring(0, 15).trim();
      const accountNumber = flatMessage.substring(15, 30).trim();
      const amountStr = flatMessage.substring(30, 42).trim();
      const currency = flatMessage.substring(42, 47).trim();
      const valueDate = flatMessage.substring(47, 55).trim();
      const description = flatMessage.substring(55).trim();
      
      return {
        messageType: 'BANCS_FLAT',
        transactionId,
        accountNumber,
        amount: parseFloat(amountStr),
        currency,
        valueDate,
        description,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'BANCS',
          format: 'FLAT'
        }
      };
    } catch (error) {
      logger.error('BANCS flat file parsing failed', { error: error.message });
      throw new Error(`BANCS flat file parsing failed: ${error.message}`);
    }
  }
}