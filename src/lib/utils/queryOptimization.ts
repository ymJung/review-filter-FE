// Database query optimization utilities for Firestore

import { 
  Query, 
  QueryConstraint, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  DocumentSnapshot,
  QuerySnapshot,
  getDocs,
  getDoc,
  doc,
  collection,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { queryCache, generateCacheKey } from './cache';

export interface QueryOptions {
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  where?: { field: string; operator: any; value: any }[];
  startAfter?: DocumentSnapshot;
  endBefore?: DocumentSnapshot;
  cache?: boolean;
  cacheTTL?: number;
}

export interface PaginationOptions {
  pageSize: number;
  lastDoc?: DocumentSnapshot;
  direction?: 'next' | 'prev';
}

export interface QueryResult<T> {
  data: T[];
  lastDoc?: DocumentSnapshot;
  firstDoc?: DocumentSnapshot;
  hasMore: boolean;
  totalCount?: number;
}

// Optimized query builder
export class OptimizedQueryBuilder<T> {
  private collectionRef: CollectionReference;
  private constraints: QueryConstraint[] = [];
  private cacheEnabled = true;
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(collectionPath: string) {
    this.collectionRef = collection(db, collectionPath);
  }

  // Add where constraint with optimization
  where(field: string, operator: any, value: any): this {
    // Optimize null/undefined checks
    if (value === null || value === undefined) {
      return this;
    }

    // Optimize array contains queries
    if (operator === 'array-contains' && Array.isArray(value) && value.length === 0) {
      return this;
    }

    this.constraints.push(where(field, operator, value));
    return this;
  }

  // Add order by constraint
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  // Add limit constraint
  limit(count: number): this {
    if (count > 0) {
      this.constraints.push(limit(count));
    }
    return this;
  }

  // Add pagination constraints
  startAfter(snapshot: DocumentSnapshot): this {
    this.constraints.push(startAfter(snapshot));
    return this;
  }

  endBefore(snapshot: DocumentSnapshot): this {
    this.constraints.push(endBefore(snapshot));
    return this;
  }

  // Enable/disable caching
  cache(enabled: boolean, ttl?: number): this {
    this.cacheEnabled = enabled;
    if (ttl) {
      this.cacheTTL = ttl;
    }
    return this;
  }

  // Build and execute query
  async execute(): Promise<QuerySnapshot> {
    const builtQuery = query(this.collectionRef, ...this.constraints);
    
    // Generate cache key if caching is enabled
    if (this.cacheEnabled) {
      const cacheKey = this.generateCacheKey();
      const cached = await queryCache.get(cacheKey) as QuerySnapshot | null;
      
      if (cached) {
        return cached;
      }

      const result = await getDocs(builtQuery);
      await queryCache.set(cacheKey, result, this.cacheTTL);
      return result;
    }

    return getDocs(builtQuery);
  }

  // Execute with pagination
  async executePaginated(options: PaginationOptions): Promise<QueryResult<T>> {
    let paginatedQuery = query(this.collectionRef, ...this.constraints);
    
    // Add pagination constraints
    if (options.lastDoc) {
      if (options.direction === 'prev') {
        paginatedQuery = query(paginatedQuery, endBefore(options.lastDoc), limit(options.pageSize));
      } else {
        paginatedQuery = query(paginatedQuery, startAfter(options.lastDoc), limit(options.pageSize));
      }
    } else {
      paginatedQuery = query(paginatedQuery, limit(options.pageSize));
    }

    const snapshot = await getDocs(paginatedQuery);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    
    return {
      data,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      firstDoc: snapshot.docs[0],
      hasMore: snapshot.docs.length === options.pageSize,
    };
  }

  private generateCacheKey(): string {
    const constraintStrings = this.constraints.map(constraint => {
      // This is a simplified cache key generation
      // In a real implementation, you'd want to serialize constraints properly
      return constraint.toString();
    });
    
    return generateCacheKey(this.collectionRef.path, {
      constraints: constraintStrings.join('|'),
    });
  }
}

// Batch operations for better performance
export class BatchOperations {
  private operations: Array<() => Promise<any>> = [];
  private batchSize: number;

  constructor(batchSize: number = 10) {
    this.batchSize = batchSize;
  }

  add(operation: () => Promise<any>): this {
    this.operations.push(operation);
    return this;
  }

  async execute(): Promise<any[]> {
    const results: any[] = [];
    
    // Process operations in batches
    for (let i = 0; i < this.operations.length; i += this.batchSize) {
      const batch = this.operations.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }

  clear(): this {
    this.operations = [];
    return this;
  }
}

// Query optimization analyzer
export class QueryAnalyzer {
  private queryMetrics: Map<string, {
    executionTime: number;
    resultCount: number;
    cacheHit: boolean;
    timestamp: number;
  }> = new Map();

  recordQuery(
    queryKey: string,
    executionTime: number,
    resultCount: number,
    cacheHit: boolean = false
  ): void {
    this.queryMetrics.set(queryKey, {
      executionTime,
      resultCount,
      cacheHit,
      timestamp: Date.now(),
    });
  }

  getSlowQueries(threshold: number = 1000): Array<{
    query: string;
    metrics: any;
  }> {
    return Array.from(this.queryMetrics.entries())
      .filter(([_, metrics]) => metrics.executionTime > threshold)
      .map(([query, metrics]) => ({ query, metrics }));
  }

  getCacheHitRate(): number {
    const total = this.queryMetrics.size;
    if (total === 0) return 0;

    const cacheHits = Array.from(this.queryMetrics.values())
      .filter(metrics => metrics.cacheHit).length;

    return (cacheHits / total) * 100;
  }

  getAverageExecutionTime(): number {
    const metrics = Array.from(this.queryMetrics.values());
    if (metrics.length === 0) return 0;

    const totalTime = metrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    return totalTime / metrics.length;
  }

  generateReport(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: any[];
  } {
    return {
      totalQueries: this.queryMetrics.size,
      averageExecutionTime: this.getAverageExecutionTime(),
      cacheHitRate: this.getCacheHitRate(),
      slowQueries: this.getSlowQueries(),
    };
  }
}

// Global query analyzer instance
export const queryAnalyzer = new QueryAnalyzer();

// Optimized document fetcher with caching
export const fetchDocumentOptimized = async <T>(
  collectionPath: string,
  docId: string,
  useCache: boolean = true
): Promise<T | null> => {
  const cacheKey = `doc:${collectionPath}:${docId}`;
  
  if (useCache) {
    const cached = await queryCache.get(cacheKey) as T | null;
    if (cached) {
      return cached;
    }
  }

  const startTime = performance.now();
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  const executionTime = performance.now() - startTime;

  if (docSnap.exists()) {
    const data = { id: docSnap.id, ...docSnap.data() } as T;
    
    if (useCache) {
      await queryCache.set(cacheKey, data);
    }

    queryAnalyzer.recordQuery(cacheKey, executionTime, 1, false);
    return data;
  }

  queryAnalyzer.recordQuery(cacheKey, executionTime, 0, false);
  return null;
};

// Optimized collection fetcher with advanced filtering
export const fetchCollectionOptimized = async <T>(
  collectionPath: string,
  options: QueryOptions = {}
): Promise<T[]> => {
  const builder = new OptimizedQueryBuilder<T>(collectionPath);

  // Apply where constraints
  if (options.where) {
    options.where.forEach(({ field, operator, value }) => {
      builder.where(field, operator, value);
    });
  }

  // Apply order by constraints
  if (options.orderBy) {
    options.orderBy.forEach(({ field, direction }) => {
      builder.orderBy(field, direction);
    });
  }

  // Apply limit
  if (options.limit) {
    builder.limit(options.limit);
  }

  // Apply pagination
  if (options.startAfter) {
    builder.startAfter(options.startAfter);
  }
  if (options.endBefore) {
    builder.endBefore(options.endBefore);
  }

  // Configure caching
  if (options.cache !== undefined) {
    builder.cache(options.cache, options.cacheTTL);
  }

  const startTime = performance.now();
  const snapshot = await builder.execute();
  const executionTime = performance.now() - startTime;

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  
  queryAnalyzer.recordQuery(
    `collection:${collectionPath}`,
    executionTime,
    data.length,
    false
  );

  return data;
};

// Index optimization suggestions
export const generateIndexSuggestions = (
  collectionPath: string,
  queryConstraints: QueryConstraint[]
): string[] => {
  const suggestions: string[] = [];
  
  // Analyze query patterns and suggest composite indexes
  const whereFields: string[] = [];
  const orderByFields: string[] = [];
  
  queryConstraints.forEach(constraint => {
    // This is a simplified analysis
    // In a real implementation, you'd parse the constraint objects
    const constraintStr = constraint.toString();
    
    if (constraintStr.includes('where')) {
      // Extract field name from where constraint
      // This is pseudo-code - actual implementation would be more complex
    }
    
    if (constraintStr.includes('orderBy')) {
      // Extract field name from orderBy constraint
    }
  });

  if (whereFields.length > 1) {
    suggestions.push(`Consider creating a composite index for fields: ${whereFields.join(', ')}`);
  }

  if (whereFields.length > 0 && orderByFields.length > 0) {
    suggestions.push(`Consider creating a composite index with where fields (${whereFields.join(', ')}) and order by fields (${orderByFields.join(', ')})`);
  }

  return suggestions;
};

// Query performance decorator
export const withQueryPerformance = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  queryName: string
): T => {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const executionTime = performance.now() - startTime;
      
      queryAnalyzer.recordQuery(
        queryName,
        executionTime,
        Array.isArray(result) ? result.length : 1,
        false
      );
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      queryAnalyzer.recordQuery(queryName, executionTime, 0, false);
      throw error;
    }
  }) as T;
};