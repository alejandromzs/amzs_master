/// <reference types="cypress" />

export default class MainDashboardPage {
  // Selectors
  get categoryDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="nav-categories"]');
  }
  
  get handToolsLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('a[href*="hand-tools"]');
  }
  
  get searchInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="search-query"]');
  }
  
  get searchButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="search-submit"]');
  }
  
  get cartIcon(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="nav-cart"]');
  }
  
  get signInLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="nav-sign-in"]');
  }
  
  get userMenu(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="nav-user-menu"]');
  }
  
  get productCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="product-card"]');
  }
  
  get productTitles(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="product-name"]');
  }
  
  get productPrices(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="product-price"]');
  }

  // Actions
  visit(): this {
    cy.visit('https://practicesoftwaretesting.com/');
    return this;
  }
  
  clickCategoryDropdown(): this {
    this.categoryDropdown.click();
    return this;
  }
  
  clickHandToolsLink(): this {
    this.handToolsLink.click();
    return this;
  }
  
  navigateToHandTools(): this {
    this.clickCategoryDropdown();
    this.clickHandToolsLink();
    return this;
  }
  
  searchForProduct(searchTerm: string): this {
    this.searchInput.type(searchTerm);
    this.searchButton.click();
    return this;
  }
  
  clickCartIcon(): this {
    this.cartIcon.click();
    return this;
  }
  
  clickSignInLink(): this {
    this.signInLink.click();
    return this;
  }
  
  clickUserMenu(): this {
    this.userMenu.click();
    return this;
  }
  
  clickProductCard(index: number = 0): this {
    this.productCards.eq(index).click();
    return this;
  }

  // Assertions
  shouldBeVisible(): this {
    cy.url().should('include', 'practicesoftwaretesting.com');
    cy.get('body').should('be.visible');
    return this;
  }
  
  shouldHaveProductCards(): this {
    this.productCards.should('have.length.greaterThan', 0);
    return this;
  }
  
  shouldHaveSearchInput(): this {
    this.searchInput.should('be.visible');
    return this;
  }
  
  shouldHaveCategoryDropdown(): this {
    this.categoryDropdown.should('be.visible');
    return this;
  }
  
  shouldHaveCartIcon(): this {
    this.cartIcon.should('be.visible');
    return this;
  }
  
  shouldHaveSignInLink(): this {
    this.signInLink.should('be.visible');
    return this;
  }
}
