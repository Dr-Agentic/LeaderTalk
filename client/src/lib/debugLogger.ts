/**
 * Debug Logger - Persist logs in localStorage to survive page refreshes
 * 
 * This module adds persistent logging capability to the application
 * so errors can be examined even after page refreshes.
 */

// Maximum number of log entries to keep
const MAX_LOG_ENTRIES = 100;

// Log levels
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Log entry structure
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: any;
}

// Storage key in localStorage
const STORAGE_KEY = 'leadertalk_debug_logs';

/**
 * Add a log entry to persistent storage
 */
export function addLog(level: LogLevel, message: string, details?: any) {
  try {
    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      details
    };

    // Get existing logs
    const existingLogsJson = localStorage.getItem(STORAGE_KEY);
    const logs: LogEntry[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];
    
    // Add new entry
    logs.unshift(entry);
    
    // Trim if needed
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    // Also log to console with prefix
    const prefix = `[${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, details || '');
        break;
      case 'warn':
        console.warn(prefix, message, details || '');
        break;
      case 'debug':
        console.debug(prefix, message, details || '');
        break;
      default:
        console.log(prefix, message, details || '');
    }
  } catch (err) {
    // Fallback to standard console
    console.error('Error writing to debug log:', err);
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
  }
}

/**
 * Clear all stored logs
 */
export function clearLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all stored log entries
 */
export function getLogs(): LogEntry[] {
  try {
    const logsJson = localStorage.getItem(STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (err) {
    console.error('Error reading debug logs:', err);
    return [];
  }
}

// Convenience methods for different log levels
export const logInfo = (message: string, details?: any) => addLog('info', message, details);
export const logWarn = (message: string, details?: any) => addLog('warn', message, details);
export const logError = (message: string, details?: any) => addLog('error', message, details);
export const logDebug = (message: string, details?: any) => addLog('debug', message, details);