import type { LogLevelKeys } from './logLevel.js';
import type { ReporterEvent } from './Reporter.js';
export interface BuildReporterOptions {
    level: LogLevelKeys;
    strict: boolean;
}
/** @deprecated Use BuildReporterOptions instead */
export interface LoggerOptions extends BuildReporterOptions {
}
declare class BuildReporterClass {
    private _reporter;
    private strict;
    init(options: BuildReporterOptions): void;
    verbose(message: string): void;
    log(message: string): void;
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    report(event: ReporterEvent): void;
}
export declare const BuildReporter: BuildReporterClass;
/**
 * @deprecated Use BuildReporter instead
 */
export declare const Logger: BuildReporterClass;
export {};
