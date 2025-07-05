# SwiftParser-OSS

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/%40gridworks-tech%2Fswiftparser-oss.svg)](https://www.npmjs.com/package/@gridworks-tech/swiftparser-oss)
[![Build Status](https://github.com/gridworks-tech-inc/swiftparser-oss/workflows/CI/badge.svg)](https://github.com/gridworks-tech-inc/swiftparser-oss/actions)

Open-source parser for SWIFT, ISO 20022, and banking message formats. Parse and validate messages from TCS BaNCS, FIS Systematics, Fiserv DNA, and Temenos Transact.

## Features

### Open-Source (Apache 2.0)
- ✅ SWIFT MT message parsing (MT103, MT202, MT515, MT700, MT950, MT101)
- ✅ ISO 20022 XML parsing (pacs.008, pacs.009, camt.053, camt.052)
- ✅ Banking format support (BaNCS, FIS, Fiserv, Temenos)
- ✅ SEPA SCT and ACH NACHA parsing
- ✅ Message validation
- ✅ BIC and IBAN validation

### Enterprise Features (Separate License)
- 🔒 COBOL copybook parsing and transpilation
- 🔒 Compliance data extraction (KYC, AML, sanctions)
- 🔒 Blockchain transaction conversion
- 🔒 Smart routing engine
- 🔒 Real-time monitoring and analytics

## Installation

```bash
npm install @gridworks-tech/swiftparser-oss
```

## Quick Start

```javascript
import SwiftParserOSS from '@gridworks-tech/swiftparser-oss';

const parser = new SwiftParserOSS();

// Parse MT103 message
const mt103 = ':20:123456789\n:32A:230101USD1000,00\n:50K:/12345678\n    SENDER BANK\n:59:/98765432\n    BENEFICIARY NAME';
const result = parser.parse(mt103, 'MT103');
console.log(result);

// Parse Fiserv DNA format
const fiservMessage = '...'; // Your Fiserv message
const fiservResult = parser.fiserv.parse(fiservMessage, 'DNA');
console.log(fiservResult);
```

## Use Cases

1. **Cross-Border Payments**: Parse MT103/MT202 for international wire transfers
2. **Tokenized Assets**: Parse MT515 for securities transactions
3. **Trade Finance**: Parse MT700 for letters of credit
4. **CBDC Integration**: Parse ISO 20022 for digital currency transactions
5. **Compliance**: Extract basic transaction data (full compliance in enterprise)

## Documentation

- [API Reference](docs/API.md)
- [Supported Formats](docs/FORMATS.md)
- [Examples](examples/)
- [Contributing Guide](docs/CONTRIBUTING.md)

## Enterprise Support

Need production-grade features?

- **COBOL Transpiler**: Convert legacy COBOL to modern formats
- **Compliance Engine**: Advanced KYC/AML extraction
- **Blockchain Bridge**: Direct conversion to blockchain transactions
- **24/7 Support**: SLA-backed enterprise support

Contact [enterprise@gridworks.ai](mailto:enterprise@gridworks.ai) or visit [gridworks.ai/enterprise](https://gridworks.ai/enterprise)

## Support Tiers

| Feature | Community | Bronze ($10K/yr) | Silver ($30K/yr) | Gold ($100K/yr) |
|---------|-----------|------------------|------------------|-----------------|
| Core Parser | ✅ | ✅ | ✅ | ✅ |
| Community Support | ✅ | ✅ | ✅ | ✅ |
| Email Support | ❌ | ✅ | ✅ | ✅ |
| SLA | ❌ | ❌ | 99.5% | 99.9% |
| Custom Formats | ❌ | ❌ | ✅ | ✅ |
| Dedicated Engineer | ❌ | ❌ | ❌ | ✅ |

## License

SwiftParser-OSS is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## Security

For security issues, please email security@gridworks.ai instead of using the issue tracker.
