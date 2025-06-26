;(function(){
    console.log("loading debug bridge..")
    const origLog   = console.log.bind(console)
    const origWarn  = console.warn.bind(console)
    const origError = console.error.bind(console)
    const emit = window.runtime?.EventsEmit?.bind(window.runtime)

    function send(level, args){
        // coerce args to strings
        const msg = args.map(a => {
            try { return typeof a === 'string' ? a : JSON.stringify(a) }
            catch{ return String(a) }
        }).join(' ')
        // fire-and-forget
        if(emit){
            try { emit("jetclock:frontend.log", { level, msg }) } catch {}
        }
    }

    console.log = function(...args){
        origLog(...args)
        send("info", args)
    }
    console.warn = function(...args){
        origWarn(...args)
        send("warn", args)
    }
    console.error = function(...args){
        origError(...args)
        send("error", args)
    }

    window.addEventListener("error", ev => {
        send("error", [`Uncaught`, ev.message, `@`, ev.filename+":"+ev.lineno])
    })
})();
