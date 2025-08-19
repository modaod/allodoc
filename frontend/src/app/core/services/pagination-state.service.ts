import { Injectable } from '@angular/core';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  search?: string;
  filters?: any;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable({
  providedIn: 'root'
})
export class PaginationStateService {
  private states = new Map<string, PaginationState>();

  constructor() {}

  /**
   * Save pagination state for a specific route
   * @param key Unique identifier for the route/component
   * @param state The pagination state to save
   */
  saveState(key: string, state: PaginationState): void {
    this.states.set(key, { ...state });
  }

  /**
   * Retrieve pagination state for a specific route
   * @param key Unique identifier for the route/component
   * @returns The saved state or null if not found
   */
  getState(key: string): PaginationState | null {
    const state = this.states.get(key);
    return state ? { ...state } : null;
  }

  /**
   * Clear state for a specific route
   * @param key Unique identifier for the route/component
   */
  clearState(key: string): void {
    this.states.delete(key);
  }

  /**
   * Clear all saved states (useful on logout)
   */
  clearAll(): void {
    this.states.clear();
  }

  /**
   * Check if state exists for a specific route
   * @param key Unique identifier for the route/component
   */
  hasState(key: string): boolean {
    return this.states.has(key);
  }
}