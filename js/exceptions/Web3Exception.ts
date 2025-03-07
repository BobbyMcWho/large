class Web3Exception extends Error {

    constructor(ex) {
        super(ex.message)
        this.name = "Web3Exception"

        // Use V8's native method if available, otherwise fallback
        if ("captureStackTrace" in Error)
            Error.captureStackTrace(this, Web3Exception);
        else
                    //@ts-ignore
            this.stack = (ex).stack;
    }

}

export {
    Web3Exception
}
