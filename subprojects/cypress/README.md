# Cypress E2E Testing

This project contains end-to-end tests for the Practice Software Testing website using Cypress with Page Object Model pattern.

## Project Structure

```
cypress/
├── e2e/
│   ├── amzsTest1.cy.js                           # Original test
│   └── practice-software-testing-navigation.cy.js # New navigation tests
├── support/
│   └── pages/
│       ├── MainDashboardPage.js                  # Main dashboard page object
│       └── HandToolsPage.js                      # Hand tools page object
├── fixtures/
│   └── example.json
└── cypress.config.js
```

## Page Objects

### MainDashboardPage
- Handles navigation and interactions on the main dashboard
- Methods for category navigation, search, cart, and user authentication
- Selectors for product cards, search input, and navigation elements

### HandToolsPage
- Manages the hand tools category page
- Methods for product filtering, sorting, and cart operations
- Selectors for product information and navigation elements

## Test Coverage

The `practice-software-testing-navigation.cy.js` test file covers:

1. **Main Dashboard Navigation**
   - Page loading and visibility
   - Product card display
   - Navigation elements

2. **Category Navigation**
   - Dashboard to Hand Tools navigation
   - Direct Hand Tools page access
   - Product information display

3. **Navigation Flow**
   - Complete navigation cycles
   - Back navigation functionality
   - State preservation

4. **Hand Tools Functionality**
   - Filtering and sorting
   - Add to cart operations
   - Product detail navigation

5. **Cross-page Navigation**
   - Session preservation
   - Navigation state maintenance

## Running Tests

### Open Cypress Test Runner
```bash
npm run test:open
```

### Run Tests in Headless Mode
```bash
npm run test
```

### Run Tests with Browser UI
```bash
npm run test:headed
```

## Configuration

The `cypress.config.js` includes:
- Base URL: `https://practicesoftwaretesting.com`
- Viewport: 1280x720
- Timeouts: 10 seconds
- Video recording enabled
- Screenshot on failure
- Environment variables for test data

## Test Data

Environment variables are configured for test user credentials:
- Email: `test@example.com`
- Password: `welcome01`

## Best Practices Implemented

1. **Page Object Model**: Separates page logic from test logic
2. **Reusable Methods**: Common actions are abstracted into methods
3. **Clear Selectors**: Uses data-test attributes for reliable element selection
4. **Comprehensive Assertions**: Multiple verification points for robust testing
5. **Navigation Testing**: Covers both forward and backward navigation flows
