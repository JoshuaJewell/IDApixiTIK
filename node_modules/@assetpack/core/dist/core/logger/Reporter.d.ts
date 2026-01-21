import type { LogLevelKeys } from './logLevel.js';
export interface LogEvent {
    type: 'log';
    level: LogLevelKeys;
    message: string;
}
export interface BuildEvent {
    type: 'buildStart' | 'buildProgress' | 'buildSuccess' | 'buildFailure';
    phase?: 'start' | 'delete' | 'transform' | 'post' | 'finish';
    message?: string;
}
export type ReporterEvent = LogEvent | BuildEvent;
export declare class Reporter {
    level: LogLevelKeys;
    private _buildTime;
    report(event: ReporterEvent): void;
}
