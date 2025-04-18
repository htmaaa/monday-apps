# Migration Guide

This guide explains how to move your existing S-E-T! app into the monorepo structure.

## Steps to Migrate S-E-T! App

1. **Copy Source Files**

   Copy the following files from your original repository:

   ```bash
   # From your current monday-app directory
   cp -r src/* ../monday-apps/apps/set-timeline-creator/src/
   cp .env ../monday-apps/apps/set-timeline-creator/
   cp public/* ../monday-apps/apps/set-timeline-creator/public/
   ```

2. **Update Imports to Use Shared Libraries**

   Update your MondayApp.tsx file to use the shared API utilities:

   ```typescript
   // Before
   import mondaySdk from 'monday-sdk-js';
   
   const monday = mondaySdk();
   const apiCache = {...}; // Your existing cache implementation
   
   // After
   import { mondayApi, MondayApi } from '@monday-apps/api';
   
   // Use mondayApi instance or create your own
   const api = mondayApi;
   // Or: const api = new MondayApi(process.env.REACT_APP_MONDAY_API_TOKEN);
   ```

3. **Update API Calls**

   Replace your existing API calls with the shared utility:

   ```typescript
   // Before
   const response = await monday.api(query);
   
   // After
   const { data, error } = await mondayApi.query(query, { 
     cacheResults: true,
     cacheDuration: 10000 
   });
   
   if (error) {
     console.error('API error:', error);
     return;
   }
   
   // Use data.data instead of response.data
   ```

4. **Update Package.json**

   The package.json has already been updated, but double-check that all necessary dependencies are included.

5. **Test Your App**

   ```bash
   cd ../monday-apps
   npm install
   npm run start:set
   ```

6. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "Migrated S-E-T! app to monorepo structure"
   git push
   ```

## Creating New Apps

For creating new apps in the monorepo:

1. Create a new directory under `apps/`:
   ```bash
   mkdir -p apps/new-app-name/src apps/new-app-name/public
   ```

2. Create a package.json file for your new app:
   ```bash
   cp apps/set-timeline-creator/package.json apps/new-app-name/
   ```

3. Update the package.json with the correct name and dependencies

4. Add a start script in the root package.json:
   ```json
   "start:newapp": "cd apps/new-app-name && npm start"
   ```

5. Create your app using the shared utilities 