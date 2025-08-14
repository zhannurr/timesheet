import { collection, getDocs, query, where, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Cache for storing query results
const queryCache = new Map<string, { data: any[]; timestamp: number; ttl: number }>();

// Default TTL for cache (5 minutes)
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// Debounce function to limit rapid function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function to limit function execution frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Optimized query with caching
export async function getCachedQuery(
  collectionName: string,
  constraints: any[] = [],
  cacheKey?: string,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<any[]> {
  const key = cacheKey || `${collectionName}_${JSON.stringify(constraints)}`;
  const cached = queryCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const querySnapshot = await getDocs(q);
    
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Cache the result
    queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw error;
  }
}

// Clear cache for specific collection or all cache
export function clearCache(collectionName?: string): void {
  if (collectionName) {
    // Clear cache for specific collection
    for (const [key] of queryCache) {
      if (key.startsWith(collectionName)) {
        queryCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    queryCache.clear();
  }
}

// Optimized real-time listener with error handling and reconnection
export function createOptimizedListener(
  collectionName: string,
  constraints: any[] = [],
  onData: (data: any[]) => void,
  onError?: (error: Error) => void,
  maxRetries: number = 3
): () => void {
  let retryCount = 0;
  let unsubscribe: (() => void) | null = null;
  
  const setupListener = () => {
    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      
      unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          onData(data);
          retryCount = 0; // Reset retry count on successful data
        },
        (error) => {
          console.error(`Error in ${collectionName} listener:`, error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying ${collectionName} listener (${retryCount}/${maxRetries})...`);
            
            // Exponential backoff retry
            setTimeout(() => {
              if (unsubscribe) {
                unsubscribe();
                setupListener();
              }
            }, Math.pow(2, retryCount) * 1000);
          } else {
            onError?.(error);
          }
        }
      );
    } catch (error) {
      console.error(`Error setting up ${collectionName} listener:`, error);
      onError?.(error as Error);
    }
  };
  
  setupListener();
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// Batch operations for better performance
export async function batchOperation<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
}

// Performance monitoring
export const performanceMetrics = {
  queryTimes: new Map<string, number[]>(),
  
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (!this.queryTimes.has(operation)) {
        this.queryTimes.set(operation, []);
      }
      this.queryTimes.get(operation)!.push(duration);
      
      // Keep only last 100 measurements
      if (this.queryTimes.get(operation)!.length > 100) {
        this.queryTimes.get(operation)!.shift();
      }
    };
  },
  
  getAverageTime(operation: string): number {
    const times = this.queryTimes.get(operation);
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  },
  
  getSlowestQueries(limit: number = 5): Array<{ operation: string; avgTime: number }> {
    const operations = Array.from(this.queryTimes.entries()).map(([operation, times]) => ({
      operation,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }));
    
    return operations
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }
};
