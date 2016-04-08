export default class Logger {

    constructor(logFn) {

        if (!logFn) {
            return;
        }

        this.callback = (severity, ...args) => {

            try {
                logFn(severity, ...args);
            } catch (ex) {
                // IGNORE
            }
        };
    }

    write(severity, ...args) {

        if (!this.callback) {
            return;
        }

        setImmediate(this.callback, severity, ...args);
    }

    alert(...args) {
        this.write('alert', ...args);
    }

    crit(...args) {
        this.write('crit', ...args);
    }

    debug(...args) {
        this.write('debug', ...args);
    }

    emerg(...args) {
        this.write('emerg', ...args);
    }

    error(...args) {
        this.write('error', ...args);
    }

    fatal(...args) {
        this.write('fatal', ...args);
    }

    info(...args) {
        this.write('info', ...args);
    }

    notice(...args) {
        this.write('notice', ...args);
    }

    silly(...args) {
        this.write('silly', ...args);
    }

    trace(...args) {
        this.write('trace', ...args);
    }

    verbose(...args) {
        this.write('verbose', ...args);
    }

    warn(...args) {
        this.write('warn', ...args);
    }

    warning(...args) {
        this.write('warning', ...args);
    }
}