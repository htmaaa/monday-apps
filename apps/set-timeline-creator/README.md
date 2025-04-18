# S-E-T! (Simple Efficient Timeline Creator)

A streamlined tool for creating and managing timelines in Monday.com boards.

## Features

- Select board from dropdown or enter board ID manually
- Create new timeline column or use existing one
- Use manual dates for all items or use dates from existing date columns
- Support for selecting start and end date columns
- Create test items directly from the app
- Refresh board data manually
- Optimized performance with API response caching
- Batch processing of timeline updates

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Access to a Monday.com account with API credentials

### Setup

1. Add your Monday.com API token to a `.env` file:

```
REACT_APP_MONDAY_API_TOKEN=your_token_here
```

2. Install dependencies and start the development server:

```bash
# From the root of the monorepo
npm install
npm run start:set
```

## Usage

1. Select your board from the dropdown or enter a board ID manually
2. Choose whether to create a new timeline column or use an existing one
3. Select your date source (manual dates or from existing columns)
4. Configure start and end dates
5. Click "Create Timeline" to generate your timeline

## Architecture

This app uses:
- React with TypeScript
- Monday.com SDK for API interaction
- Shared API utilities from the monorepo
- API response caching for better performance

## Version History

- v1.0: Initial release with core timeline creation functionality 