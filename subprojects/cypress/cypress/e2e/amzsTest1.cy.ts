/// <reference types="cypress" />

describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://monorepo-turborepo-amzs-docs.vercel.app/')
    cy.get('code').should('have.text','apps/docs/app/page.tsx')
    // cy.get('a[href*="monorepo-turborepo-amzs-web.vercel.app"]').invoke('removeAttr', 'target').click()

    cy.get('a').contains('Go to Web App').click()

    cy.origin('https://monorepo-turborepo-amzs-web.vercel.app', () => {
      cy.url().should('include', 'monorepo-turborepo-amzs-web.vercel.app') 
      cy.get('code').should('have.text','apps/web/app/page.tsx')
      cy.get('a').contains('Go to doc App').click()
    })

    cy.get('code').should('have.text','apps/docs/app/page.tsx')
    
  })
})
