# Monday.com Apps Monorepo

This monorepo contains a collection of apps and utilities for enhancing Monday.com.

## Apps

| App | Description | Status |
|-----|-------------|--------|
| [S-E-T!](./apps/set-timeline-creator) | Simple Efficient Timeline Creator | v1.0 |

## Structure

```
monday-apps/
├── apps/                  # Individual applications
│   └── set-timeline-creator/  # S-E-T! Timeline Creator
├── shared/                # Shared code between apps
│   ├── api/               # Monday.com API utilities
│   ├── components/        # Reusable UI components
│   └── utils/             # Common utility functions
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Access to a Monday.com account with API credentials

### Development

```bash
# Install dependencies
npm install

# Run a specific app (e.g., S-E-T!)
npm run start:set

# Build all apps
npm run build
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 