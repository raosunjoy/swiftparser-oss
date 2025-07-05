/**
 * SwiftParser-OSS
 * Open-source SWIFT message parser
 * 
 * Copyright (c) 2024 Gridworks Tech Inc.
 * Licensed under Apache License 2.0
 * 
 * This is the open-source version. For enterprise features including:
 * - COBOL transpiler
 * - Compliance extraction
 * - Blockchain conversion
 * - Smart routing
 * 
 * Contact: enterprise@gridworks.ai
 */

/**
 * SWIFT Message Parser
 * Handles MT103 (Customer Credit Transfer) and MT202 (Financial Institution Transfer) messages
 * 
 * Banking Legacy-to-Blockchain B2BaaS Platform
 * Core component for legacy SWIFT integration
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'swift-parser' }
});

/**
 * SWIFT Message Field Definitions
 */
const SWIFT_FIELDS = {
  MT103: {
    '20': 'transaction_reference',
    '23B': 'bank_operation_code',
    '32A': 'value_date_currency_amount',
    '50K': 'ordering_customer',
    '52A': 'ordering_institution',
    '53A': 'senders_correspondent',
    '56A': 'intermediary_institution',
    '57A': 'account_with_institution',
    '59': 'beneficiary_customer',
    '70': 'remittance_information',
    '71A': 'details_of_charges'
  },
  MT202: {
    '20': 'transaction_reference',
    '21': 'related_reference',
    '32A': 'value_date_currency_amount',
    '52A': 'ordering_institution',
    '53A': 'senders_correspondent',
    '56A': 'intermediary_institution',
    '57A': 'account_with_institution',
    '58A': 'beneficiary_institution',
    '72': 'sender_to_receiver_information'
  }
};

/**
 * SWIFT Message Parser Class
 */
class SWIFTParser {
  constructor() {
    this.supportedMessageTypes = ['MT103', 'MT202'];
    logger.info('SWIFT Parser initialized', { 
      supportedTypes: this.supportedMessageTypes 
    });
  }

  /**
   * Parse SWIFT message from raw text
   * @param {string} rawMessage - Raw SWIFT message
   * @returns {Object} Parsed message object
   */
  parse(rawMessage) {
    try {
      if (!rawMessage || typeof rawMessage !== 'string') {
        throw new Error('Invalid message format: message must be a non-empty string');
      }

      // Extract message type from header
      const messageType = this.extractMessageType(rawMessage);
      
      if (!this.supportedMessageTypes.includes(messageType)) {
        throw new Error(`Unsupported message type: ${messageType}`);
      }

      // Parse message fields
      const fields = this.parseFields(rawMessage, messageType);
      
      // Validate required fields
      this.validateRequiredFields(fields, messageType);

      // Create standardized message object
      const parsedMessage = this.createStandardizedMessage(fields, messageType);

      logger.info('Message parsed successfully', {
        messageType,
        transactionReference: parsedMessage.transactionReference,
        amount: parsedMessage.amount,
        currency: parsedMessage.currency
      });

      return parsedMessage;

    } catch (error) {
      logger.error('SWIFT message parsing failed', {
        error: error.message,
        messagePreview: (rawMessage && typeof rawMessage === 'string') ? rawMessage.substring(0, 100) : null
      });
      throw error;
    }
  }

  /**
   * Extract message type from SWIFT header
   * @param {string} message - Raw SWIFT message
   * @returns {string} Message type (e.g., 'MT103')
   */
  extractMessageType(message) {
    // SWIFT messages have {2:I103...} format where 103 is the message type
    // Look for message type in block 2 (application header)
    const headerMatch = message.match(/\{2:I(\d{3})/);
    
    if (!headerMatch) {
      throw new Error('Invalid SWIFT message format: missing application header');
    }

    // Extract message type
    const messageTypeNumber = headerMatch[1];
    const messageType = `MT${messageTypeNumber}`;
    
    return messageType;
  }

  /**
   * Parse SWIFT message fields
   * @param {string} message - Raw SWIFT message
   * @param {string} messageType - Message type
   * @returns {Object} Parsed fields
   */
  parseFields(message, messageType) {
    const fields = {};
    const fieldDefinitions = SWIFT_FIELDS[messageType];

    // Extract text block (block 4) containing the message fields
    const textBlockMatch = message.match(/\{4:(.*?)\}/s);
    
    if (!textBlockMatch) {
      throw new Error('Invalid SWIFT message format: missing text block');
    }

    const textBlock = textBlockMatch[1];

    // Parse individual fields using regex
    // SWIFT fields start with :tag: followed by content
    const fieldMatches = textBlock.match(/:(\d{2}[A-Z]?):(.*?)(?=:\d{2}[A-Z]?:|$)/gs);

    if (!fieldMatches) {
      throw new Error('No valid fields found in message');
    }

    fieldMatches.forEach(match => {
      const fieldMatch = match.match(/:(\d{2}[A-Z]?):(.*)/s);
      if (fieldMatch) {
        const tag = fieldMatch[1];
        const content = fieldMatch[2].trim();
        
        if (fieldDefinitions[tag]) {
          fields[tag] = {
            tag,
            name: fieldDefinitions[tag],
            content
          };
        }
      }
    });

    return fields;
  }

  /**
   * Validate required fields for message type
   * @param {Object} fields - Parsed fields
   * @param {string} messageType - Message type
   */
  validateRequiredFields(fields, messageType) {
    const requiredFields = this.getRequiredFields(messageType);
    
    for (const requiredField of requiredFields) {
      if (!fields[requiredField]) {
        throw new Error(`Missing required field: ${requiredField} for ${messageType}`);
      }
    }
  }

  /**
   * Get required fields for message type
   * @param {string} messageType - Message type
   * @returns {Array} Required field tags
   */
  getRequiredFields(messageType) {
    const required = {
      MT103: ['20', '32A', '50K', '59'],
      MT202: ['20', '32A', '52A', '58A']
    };

    return required[messageType] || [];
  }

  /**
   * Create standardized message object
   * @param {Object} fields - Parsed fields
   * @param {string} messageType - Message type
   * @returns {Object} Standardized message
   */
  createStandardizedMessage(fields, messageType) {
    const message = {
      id: uuidv4(),
      messageType,
      transactionReference: fields['20']?.content,
      timestamp: new Date().toISOString(),
      status: 'parsed',
      originalFields: fields
    };

    // Parse amount and currency from field 32A
    if (fields['32A']) {
      const amountData = this.parseAmountField(fields['32A'].content);
      message.amount = amountData.amount;
      message.currency = amountData.currency;
      message.valueDate = amountData.valueDate;
    }

    // Parse sender and receiver based on message type
    if (messageType === 'MT103') {
      message.sender = this.parseCustomerInfo(fields['50K']?.content);
      message.receiver = this.parseCustomerInfo(fields['59']?.content);
      message.orderingInstitution = fields['52A']?.content;
      message.beneficiaryInstitution = fields['57A']?.content;
      message.remittanceInfo = fields['70']?.content;
    } else if (messageType === 'MT202') {
      message.orderingInstitution = fields['52A']?.content;
      message.beneficiaryInstitution = fields['58A']?.content;
      message.senderToReceiverInfo = fields['72']?.content;
    }

    return message;
  }

  /**
   * Parse amount field (32A format: YYMMDDCCCNNNNNNNNN)
   * @param {string} content - Field content
   * @returns {Object} Parsed amount data
   */
  parseAmountField(content) {
    // Format: YYMMDDCCCNNNNNNNNN (date + currency + amount)
    const match = content.match(/^(\d{6})([A-Z]{3})([\d,\.]+)$/);
    
    if (!match) {
      throw new Error(`Invalid amount field format: ${content}`);
    }

    const [, dateStr, currency, amountStr] = match;
    
    // Parse date (YYMMDD) - Use UTC to avoid timezone issues
    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(4, 6));
    const valueDate = new Date(Date.UTC(year, month, day));

    // Parse amount (remove commas, convert to float)
    const amount = parseFloat(amountStr.replace(/,/g, ''));

    return {
      valueDate: valueDate.toISOString().split('T')[0],
      currency,
      amount
    };
  }

  /**
   * Parse customer information
   * @param {string} content - Customer field content
   * @returns {Object} Parsed customer info
   */
  parseCustomerInfo(content) {
    if (!content) return null;

    const lines = content.split('\n').map(line => line.trim());
    
    return {
      account: lines[0] || null,
      name: lines[1] || null,
      address: lines.slice(2).join(', ') || null,
      raw: content
    };
  }

  /**
   * Convert parsed message to JSON format
   * @param {Object} message - Parsed message
   * @returns {string} JSON representation
   */
  toJSON(message) {
    return JSON.stringify(message, null, 2);
  }

  /**
   * Validate BIC (Bank Identifier Code) format
   * @param {string} bic - BIC code
   * @returns {boolean} True if valid
   */
  validateBIC(bic) {
    if (!bic || typeof bic !== 'string') return false;
    
    // BIC format: 8 or 11 characters
    // 4 letters (institution) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)
    const upperBic = bic.toUpperCase();
    if (upperBic.length !== 8 && upperBic.length !== 11) return false;
    
    const bicPattern = /^[A-Z]{4}[A-Z]{2}[0-9A-Z]{2}([0-9A-Z]{3})?$/;
    return bicPattern.test(upperBic);
  }

  /**
   * Get supported message types
   * @returns {Array} Supported message types
   */
  getSupportedTypes() {
    return [...this.supportedMessageTypes];
  }
}

export default SWIFTParser;