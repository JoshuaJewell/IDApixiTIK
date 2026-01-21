import { Reporter } from './Reporter.js';
class BuildReporterClass {
    _reporter = new Reporter();
    strict = false;
    init(options) {
        this._reporter.level = options.level || 'info';
        this.strict = options.strict;
    }
    verbose(message) {
        this.report({
            type: 'log',
            level: 'verbose',
            message,
        });
    }
    log(message) {
        this.info(message);
    }
    info(message) {
        this.report({
            type: 'log',
            level: 'info',
            message,
        });
    }
    error(message) {
        this.report({
            type: 'log',
            level: 'error',
            message,
        });
        if (this.strict) {
            this.report({ type: 'buildFailure' });
            process.exit(1);
        }
    }
    warn(message) {
        this.report({
            type: 'log',
            level: 'warn',
            message,
        });
    }
    report(event) {
        this._reporter.report(event);
    }
}
export const BuildReporter = new BuildReporterClass();
/**
 * @deprecated Use BuildReporter instead
 */
export const Logger = BuildReporter;
//# sourceMappingURL=BuildReporter.js.map