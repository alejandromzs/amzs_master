/// <reference types="cypress" />

export default class HandToolsPage {
  // Selectors
  get pageTitle(): Cypress.Chainable<JQuery<HTMLHeadingElement>> {
    return cy.get('h1');
  }
  
  get breadcrumb(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="breadcrumb"]');
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
  
  get addToCartButtons(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="add-to-cart"]');
  }
  
  get filterSection(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="filter-section"]');
  }
  
  get brandFilter(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="brand-filter"]');
  }
  
  get priceFilter(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="price-filter"]');
  }
  
  get sortDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="sort"]');
  }
  
  get pagination(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('[data-test="pagination"]');
  }
  
  get backToCategoriesLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('a[href*="categories"]');
  }
  
  get homeLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('a[href="/"]');
  }

  // Actions
  visit(): this {
    cy.visit('https://practicesoftwaretesting.com/#/category/hand-tools');
    return this;
  }
  
  clickProductCard(index: number = 0): this {
    this.productCards.eq(index).click();
    return this;
  }
  
  addProductToCart(index: number = 0): this {
    this.addToCartButtons.eq(index).click();
    return this;
  }
  
  filterByBrand(brandName: string): this {
    this.brandFilter.contains(brandName).click();
    return this;
  }
  
  filterByPriceRange(minPrice: string, maxPrice: string): this {
    this.priceFilter.within(() => {
      cy.get('input[type="number"]').first().type(minPrice);
      cy.get('input[type="number"]').last().type(maxPrice);
    });
    return this;
  }
  
  sortBy(sortOption: string): this {
    this.sortDropdown.select(sortOption);
    return this;
  }
  
  clickBackToCategories(): this {
    this.backToCategoriesLink.click();
    return this;
  }
  
  clickHomeLink(): this {
    this.homeLink.click();
    return this;
  }
  
  navigateToProduct(index: number = 0): this {
    this.clickProductCard(index);
    return this;
  }

  // Assertions
  shouldBeVisible(): this {
    cy.url().should('include', 'category/hand-tools');
    cy.get('body').should('be.visible');
    return this;
  }
  
  shouldHavePageTitle(): this {
    this.pageTitle.should('be.visible');
    return this;
  }
  
  shouldHaveHandToolsProducts(): this {
    this.productCards.should('have.length.greaterThan', 0);
    return this;
  }
  
  shouldHaveBreadcrumb(): this {
    this.breadcrumb.should('be.visible');
    return this;
  }
  
  shouldHaveFilterSection(): this {
    this.filterSection.should('be.visible');
    return this;
  }
  
  shouldHaveSortDropdown(): this {
    this.sortDropdown.should('be.visible');
    return this;
  }
  
  shouldHaveAddToCartButtons(): this {
    this.addToCartButtons.should('have.length.greaterThan', 0);
    return this;
  }
  
  shouldHaveProductTitles(): this {
    this.productTitles.should('have.length.greaterThan', 0);
    return this;
  }
  
  shouldHaveProductPrices(): this {
    this.productPrices.should('have.length.greaterThan', 0);
    return this;
  }
  
  shouldDisplayProducts(): this {
    this.shouldHaveHandToolsProducts();
    this.shouldHaveProductTitles();
    this.shouldHaveProductPrices();
    this.shouldHaveAddToCartButtons();
    return this;
  }
  
  shouldHaveNavigationLinks(): this {
    this.backToCategoriesLink.should('be.visible');
    this.homeLink.should('be.visible');
    return this;
  }
}
