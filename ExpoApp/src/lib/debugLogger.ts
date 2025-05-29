/**
 * Debug Logger - Persist logs in AsyncStorage to survive app restarts
 * 
 * This module adds persistent logging capability to the application
 * so errors can be examined even after app restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Storage key in AsyncStorage
const STORAGE_KEY = 'leadertalk_debug_logs';

/**
 * Add a log entry to persistent storage
 */
export async function addLog(level: LogLevel, message: string, details?: any) {
  try {
    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      details
    };

    // Get existing logs
    const existingLogsJson = await AsyncStorage.getItem(STORAGE_KEY);
    const logs: LogEntry[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];
    
    // Add new entry
    logs.unshift(entry);
    
    // Trim if needed
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
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
export async function clearLogs() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all stored log entries
 */
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const logsJson = await AsyncStorage.getItem(STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (err) {
    console.error('Error reading debug logs:', err);
    return [];
  }
}

// Only enable debug/info logs in development
const isDev = process.env.NODE_ENV === 'development';

// Convenience methods for different log levels
export const logInfo = (message: string, details?: any) => isDev && addLog('info', message, details);
export const logWarn = (message: string, details?: any) => addLog('warn', message, details);
export const logError = (message: string, details?: any) => addLog('error', message, details);
export const logDebug = (message: string, details?: any) => isDev && addLog('debug', message, details);
