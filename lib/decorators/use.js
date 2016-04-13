import Result from '../actionResults/result';

export function use(middleware) {

    return (ctx) => {

        middleware(ctx.request, ctx.response, (err) => {

            if (err) {
                return ctx.throw(err);
            }

            if (ctx.response.headersSent || ctx.response.finished) {

                ctx.result = {
                    run() {
                        return Promise.resolve();
                    }
                };

                return ctx.resolve();
            }

            return ctx.next();
        });
    };
}