/// <reference types="cypress" />

import MainDashboardPage from '../support/pages/MainDashboardPage';
import HandToolsPage from '../support/pages/HandToolsPage';

describe('Practice Software Testing - Navigation Tests', () => {
  let mainDashboardPage: MainDashboardPage;
  let handToolsPage: HandToolsPage;

  beforeEach(() => {
    mainDashboardPage = new MainDashboardPage();
    handToolsPage = new HandToolsPage();
  });

  describe('Main Dashboard Navigation', () => {
    it('should load the main dashboard successfully', () => {
      mainDashboardPage
        .visit()
        .shouldBeVisible()
        .shouldHaveSearchInput()
        .shouldHaveCategoryDropdown()
        .shouldHaveCartIcon()
        .shouldHaveSignInLink();
    });

    it('should display product cards on the main dashboard', () => {
      mainDashboardPage
        .visit()
        .shouldHaveProductCards();
    });
  });

  describe('Category Navigation - Hand Tools', () => {
    it('should navigate from main dashboard to hand tools category', () => {
      mainDashboardPage
        .visit()
        .navigateToHandTools();

      handToolsPage
        .shouldBeVisible()
        .shouldHavePageTitle()
        .shouldHaveBreadcrumb()
        .shouldDisplayProducts()
        .shouldHaveNavigationLinks();
    });

    it('should navigate directly to hand tools page', () => {
      handToolsPage
        .visit()
        .shouldBeVisible()
        .shouldHaveHandToolsProducts()
        .shouldHaveFilterSection()
        .shouldHaveSortDropdown();
    });

    it('should display hand tools products with proper information', () => {
      handToolsPage
        .visit()
        .shouldHaveProductTitles()
        .shouldHaveProductPrices()
        .shouldHaveAddToCartButtons();
    });
  });

  describe('Navigation Flow', () => {
    it('should complete full navigation flow: Dashboard -> Hand Tools -> Back to Dashboard', () => {
      // Navigate from dashboard to hand tools
      mainDashboardPage
        .visit()
        .navigateToHandTools();

      handToolsPage
        .shouldBeVisible()
        .shouldDisplayProducts();

      // Navigate back to dashboard
      handToolsPage.clickHomeLink();

      mainDashboardPage
        .shouldBeVisible()
        .shouldHaveProductCards();
    });

    it('should navigate back to categories from hand tools', () => {
      handToolsPage
        .visit()
        .clickBackToCategories();

      // Should be back on main dashboard or categories page
      cy.url().should('not.include', 'category/hand-tools');
    });
  });

  describe('Hand Tools Page Functionality', () => {
    it('should allow filtering and sorting on hand tools page', () => {
      handToolsPage
        .visit()
        .shouldHaveFilterSection()
        .shouldHaveSortDropdown();

      // Test sorting functionality
      handToolsPage.sortBy('name-asc');
      
      // Verify products are still displayed after sorting
      handToolsPage.shouldHaveHandToolsProducts();
    });

    it('should allow adding products to cart', () => {
      handToolsPage
        .visit()
        .shouldHaveAddToCartButtons();

      // Click first add to cart button
      handToolsPage.addToCartButtons.first().click();
      
      // Verify cart icon is still visible (indicating successful add)
      mainDashboardPage.shouldHaveCartIcon();
    });

    it('should allow clicking on product cards', () => {
      handToolsPage
        .visit()
        .shouldHaveHandToolsProducts();

      // Click on first product card
      handToolsPage.clickProductCard(0);
      
      // Should navigate to product detail page
      cy.url().should('include', 'product');
    });
  });

  describe('Cross-page Navigation', () => {
    it('should maintain navigation state between pages', () => {
      // Start on main dashboard
      mainDashboardPage
        .visit()
        .shouldBeVisible();

      // Navigate to hand tools
      mainDashboardPage.navigateToHandTools();
      
      handToolsPage
        .shouldBeVisible()
        .shouldDisplayProducts();

      // Navigate back to main dashboard
      handToolsPage.clickHomeLink();
      
      mainDashboardPage
        .shouldBeVisible()
        .shouldHaveProductCards();
    });

    it('should preserve user session across navigation', () => {
      mainDashboardPage
        .visit()
        .shouldHaveSignInLink();

      // Navigate to hand tools
      mainDashboardPage.navigateToHandTools();
      
      handToolsPage.shouldBeVisible();

      // Navigate back and verify sign in link is still available
      handToolsPage.clickHomeLink();
      
      mainDashboardPage.shouldHaveSignInLink();
    });
  });
});
