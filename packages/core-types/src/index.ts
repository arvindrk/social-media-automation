/**
 * @core-types - Shared TypeScript types and branded types for the monorepo
 * TODO: Add domain types, DTOs, and shared interfaces
 */

/** Branded ID type for type-safe identifiers */
export type BrandId = string & { __brand: 'Id' };

/** Helper to create a branded ID */
export function createBrandId(id: string): BrandId {
  return id as BrandId;
}

// TODO: Add more shared types as the project evolves
// - User types
// - Instagram content types
// - API response types
// - etc.

