# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native pharmacy store management application built with Expo. The app manages medicine inventory, sales, suppliers, and orders for pharmacy stores. It uses SQLite for local data storage and supports multiple store management.

## Development Commands

- **Start development server**: `npm start` or `expo start`
- **Run on Android**: `npm run android` or `expo run:android` 
- **Run on iOS**: `npm run ios` or `expo run:ios`
- **Run on Web**: `npm run web` or `expo start --web`
- **Lint code**: `npm run lint` or `expo lint`
- **Build for production**: Use EAS Build with `eas build`

## Architecture Overview

### Database Layer
- **SQLite Database**: Uses `expo-sqlite` with database file `pharma_store.db`
- **Database utilities**: Located in `utils/` directory with separate files for each entity:
  - `stocksDb.ts`: Medicine/drug inventory management
  - `storesDb.ts`: Store management (multi-store support)
  - `salesDb.ts`: Sales transactions
  - `supplierDb.ts`: Supplier management
  - `orderListDb.ts`: Order management
  - `historyDb.ts`: Activity history tracking
- **Database initialization**: All tables are created through the StoreContext provider

### State Management
- **StoreContext**: Global context managing current store, store list, and database initialization
- **ErrorLogContext**: Error logging and management
- **AsyncStorage**: Used for persisting current store selection

### Navigation Structure
- **Expo Router**: File-based routing with app directory structure
- **Root Layout**: Provides StatusBar, SafeArea, and context providers
- **Auth Flow**: `(auth)` directory for welcome screens
- **Main App**: `(app)` directory for authenticated screens
- **Stack Navigation**: Configured without headers, using custom navigation

### Key Screens & Features
- **HomeScreen** (`index.tsx`): Dashboard with store selection and navigation grid
- **Inventory Management**: Add/edit stock, view inventory, track expiry
- **Sales Management**: Record sales, generate reports
- **Supplier Management**: Manage supplier information
- **Order Management**: Create and track orders
- **Export/Import**: Store data export to PDF/JSON, import validation

### Core Data Models
- **Drug**: Medicine inventory with price, MRP, quantity, expiry, batch info
- **Store**: Multi-store support with individual inventories
- **Sale**: Sales transactions with quantity and pricing
- **Supplier**: Supplier contact and location information
- **OrderList**: Purchase orders and requisitions

### Styling & UI
- **React Native StyleSheet**: Component-level styling
- **Expo Vector Icons**: Icon system using AntDesign, Feather, Ionicons, MaterialIcons
- **Custom Components**: Reusable cards and UI elements in `components/` directory
- **Responsive Design**: Uses Dimensions API for screen-aware layouts

### Export/Import Features
- **PDF Export**: Uses `expo-print` for generating reports
- **JSON Export**: Store data backup functionality
- **File System**: Uses `expo-file-system` and `expo-sharing` for file operations

### Development Notes
- **TypeScript**: Strict typing enabled with path aliases (`@/*` maps to root)
- **Mock Data**: Sample stock data available in `assets/mock/stocks.json`
- **EAS Build**: Configured for Android APK builds and iOS development
- **New Architecture**: React Native new architecture enabled