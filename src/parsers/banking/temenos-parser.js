/**
 * Temenos T24 Format Parser
 * Open-Source Implementation (Apache 2.0 License)
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import xml2js from 'xml2js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'temenos-parser' }
});

export default class TemenosParser {
  constructor() {
    this.supportedFormats = ['JSON', 'XML', 'T24'];
    this.parser = new xml2js.Parser();
  }

  detectFormat(message) {
    if (message.trim().startsWith('<?xml') || message.trim().startsWith('<TemenosTransaction>')) {
      return 'XML';
    }
    
    try {
      const parsed = JSON.parse(message);
      if (parsed.header && parsed.header.messageId && parsed.header.messageId.startsWith('TMN')) {
        return 'JSON';
      }
    } catch (e) {
      // Not JSON
    }
    
    if (message.includes('TXN.REF=') && message.includes('AMOUNT=')) {
      return 'T24';
    }
    
    return 'UNKNOWN';
  }

  parseJSON(jsonMessage) {
    try {
      const data = JSON.parse(jsonMessage);
      
      if (!data.header || !data.header.messageId) {
        throw new Error('Invalid Temenos JSON: missing header or messageId');
      }
      
      return {
        messageType: 'TEMENOS_JSON',
        header: data.header,
        transaction: data.transaction,
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        narrative: data.narrative,
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'TEMENOS',
          format: 'JSON'
        }
      };
    } catch (error) {
      logger.error('Temenos JSON parsing failed', { error: error.message });
      throw new Error(`Temenos JSON parsing failed: ${error.message}`);
    }
  }

  parseXML(xmlMessage) {
    try {
      const result = this.parser.parseString(xmlMessage, (err, result) => {
        if (err) throw err;
        return result;
      });
      
      const transaction = result.TemenosTransaction;
      if (!transaction) {
        throw new Error('Invalid Temenos XML: missing TemenosTransaction element');
      }
      
      return {
        messageType: 'TEMENOS_XML',
        transactionReference: transaction.TransactionReference[0],
        amount: parseFloat(transaction.Amount[0]),
        currency: transaction.Currency[0],
        valueDate: transaction.ValueDate[0],
        debitAccount: transaction.DebitAccount[0],
        creditAccount: transaction.CreditAccount[0],
        narrative: transaction.Narrative[0],
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'TEMENOS',
          format: 'XML'
        }
      };
    } catch (error) {
      logger.error('Temenos XML parsing failed', { error: error.message });
      throw new Error(`Temenos XML parsing failed: ${error.message}`);
    }
  }

  parseT24(t24Message) {
    try {
      const fields = {};
      const lines = t24Message.split('\n');
      
      lines.forEach(line => {
        if (line.includes('=')) {
          const [key, value] = line.split('=');
          fields[key.trim()] = value.trim();
        }
      });
      
      if (!fields['TXN.REF']) {
        throw new Error('Invalid Temenos T24: missing TXN.REF');
      }
      
      return {
        messageType: 'TEMENOS_T24',
        transactionReference: fields['TXN.REF'],
        amount: parseFloat(fields['AMOUNT']),
        currency: fields['CURRENCY'],
        valueDate: fields['VALUE.DATE'],
        debitAccount: fields['DEBIT.ACCT'],
        creditAccount: fields['CREDIT.ACCT'],
        narrative: fields['NARRATIVE'],
        customerNumber: fields['CUSTOMER.NO'],
        productCode: fields['PRODUCT.CODE'],
        timestamp: new Date().toISOString(),
        parseMetadata: {
          parseId: uuidv4(),
          parser: 'TEMENOS',
          format: 'T24'
        }
      };
    } catch (error) {
      logger.error('Temenos T24 parsing failed', { error: error.message });
      throw new Error(`Temenos T24 parsing failed: ${error.message}`);
    }
  }
}