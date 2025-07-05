# 🤝 Contributing to SwiftParser-OSS

Thank you for your interest in contributing to SwiftParser-OSS! This document provides guidelines and information for contributors.

## 🎯 Project Vision

SwiftParser-OSS is the open-source foundation for SWIFT and banking message parsing, designed to:
- Provide robust parsing for common banking formats
- Maintain enterprise upgrade paths for advanced features
- Foster community adoption and contribution
- Demonstrate clear value for enterprise solutions

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm 8+
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/raosunjoy/swiftparser-oss.git
cd swiftparser-oss

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint
```

## 🔄 Development Workflow

### 1. Fork & Branch
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/swiftparser-oss.git

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Development Guidelines

#### Code Style
- Use ES modules throughout
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use descriptive variable and function names

#### Testing Requirements
- **100% test coverage** is mandatory
- Write unit tests for all new features
- Add integration tests for complex scenarios
- Update existing tests when modifying functionality

```bash
# Run tests with coverage
npm run test:ci

# Watch mode for development
npm run test:watch
```

#### Banking Format Support
When adding support for new banking formats:

1. **Parser Structure**
   ```javascript
   // src/parsers/banking/your-parser.js
   export default class YourBankingParser {
     constructor() {
       this.supportedFormats = ['FORMAT1', 'FORMAT2'];
     }
     
     detectFormat(message) { /* ... */ }
     parseFormat1(message) { /* ... */ }
     // Standard output format required
   }
   ```

2. **Test Coverage**
   ```javascript
   // test/unit/your-parser.test.js
   describe('YourBankingParser', () => {
     // Comprehensive test coverage required
   });
   ```

3. **Integration**
   - Add to main parser routing
   - Update supported formats list
   - Add example usage

### 3. Enterprise Boundaries

SwiftParser-OSS includes stubs for enterprise features. When working on these areas:

#### Enterprise Features (Stub Only)
- COBOL transpilation
- Blockchain conversion
- Compliance extraction (AML, KYC, sanctions)
- Smart routing and optimization

#### Implementation Pattern
```javascript
export function enterpriseFeature(data) {
  throw new Error("Feature requires SwiftParser Enterprise. Contact enterprise@gridworks.ai");
}
```

#### Open Source Features (Full Implementation)
- SWIFT message parsing (all MT types)
- ISO 20022 support
- Banking format parsing
- Format detection and validation
- Error handling and logging

## 📊 Supported Banking Formats

### Current Support
- **SWIFT Messages**: MT103, MT202, MT515, MT700, MT798, MT950, MT101
- **ISO 20022**: pacs.008, pacs.009, camt.053, camt.052
- **TCS BaNCS**: XML, JSON, Flat file
- **FIS Systematics**: Fixed-width, JSON, Delimited  
- **Fiserv DNA**: JSON
- **Temenos T24**: JSON, XML, T24 format

### Adding New Formats
1. Research the format specification
2. Create parser in `src/parsers/banking/`
3. Add comprehensive tests
4. Update documentation
5. Submit PR with examples

## 🧪 Testing Standards

### Test Categories
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: End-to-end scenarios
3. **Performance Tests**: Benchmarking and scalability
4. **Security Tests**: Input validation and edge cases

### Coverage Requirements
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

```bash
# Check coverage
npm run test:coverage

# View detailed report
open coverage/index.html
```

## 📋 Pull Request Process

### 1. Before Submitting
- [ ] All tests pass
- [ ] Code coverage maintained at 100%
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### 2. PR Requirements
- Clear description of changes
- Reference to related issues
- Screenshots for UI changes
- Performance impact assessment

### 3. Review Process
1. Automated CI/CD checks
2. Code review by maintainers
3. Testing on multiple Node.js versions
4. Security audit
5. Merge approval

## 🏗️ Architecture Guidelines

### Parser Architecture
```
src/
├── index.js              # Main entry point
├── parsers/
│   ├── swift/           # SWIFT message parsers
│   ├── banking/         # Banking format parsers
│   ├── iso20022/        # ISO 20022 parsers
│   └── additional/      # Additional format support
└── utils/               # Shared utilities
```

### Design Principles
1. **Modular**: Each parser is independent
2. **Extensible**: Easy to add new formats
3. **Consistent**: Standardized output format
4. **Performant**: Optimized for high throughput
5. **Reliable**: Comprehensive error handling

## 🔒 Security Guidelines

### Input Validation
- Validate all input parameters
- Sanitize data before processing
- Handle edge cases gracefully
- Prevent injection attacks

### Data Privacy
- Never log sensitive financial data
- Anonymize examples and test data
- Follow banking data protection standards
- Implement secure defaults

## 📚 Documentation

### Required Documentation
- API documentation for public methods
- Usage examples for new features
- Migration guides for breaking changes
- Performance benchmarks

### Documentation Format
```javascript
/**
 * Parse SWIFT message
 * @param {string} message - Raw SWIFT message
 * @param {string} [format] - Optional format hint
 * @returns {Object} Parsed message object
 * @throws {Error} If message format is invalid
 * @example
 * const result = parser.parse(swiftMessage);
 * console.log(result.messageType); // 'MT103'
 */
```

## 🎯 Enterprise Considerations

### Open Source Scope
Focus on core parsing functionality that provides immediate value while maintaining clear enterprise upgrade paths.

### Enterprise Value Proposition
- Advanced compliance features
- COBOL modernization tools
- Blockchain integration
- Priority support and SLA
- Custom format development

### Contribution Boundaries
Contributors should focus on:
- Core parsing improvements
- New banking format support
- Performance optimizations
- Documentation and examples
- Bug fixes and stability

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Maintain professional discourse

### Getting Help
- GitHub Issues for bugs and features
- Discussions for questions and ideas
- Enterprise support: enterprise@gridworks.ai

### Recognition
Contributors are recognized through:
- GitHub contributor statistics
- Release notes acknowledgments
- Community showcase
- Enterprise partnership opportunities

## 📄 License

By contributing to SwiftParser-OSS, you agree that your contributions will be licensed under the Apache License 2.0.

## 🚀 Release Process

### Version Strategy
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no new features

### Release Checklist
1. Update version in package.json
2. Update CHANGELOG.md
3. Run full test suite
4. Create GitHub release
5. Automated NPM publishing
6. Update documentation

---

Thank you for contributing to SwiftParser-OSS! Together, we're building the future of banking message parsing. 🚀

**For enterprise features and priority support, contact enterprise@gridworks.ai**