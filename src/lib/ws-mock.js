// Browser-side ws (WebSocket) mock — provides WebSocket class and constants (OPEN, CONNECTING, CLOSING, CLOSED)
// to prevent Node.js `ws` requirements from failing in Turbopack/Next.js client bundle.

const DummyWS = typeof window !== 'undefined' && window.WebSocket ? window.WebSocket : class DummyWS {};

const OPEN = 1;
const CONNECTING = 0;
const CLOSING = 2;
const CLOSED = 3;

DummyWS.OPEN = OPEN;
DummyWS.CONNECTING = CONNECTING;
DummyWS.CLOSING = CLOSING;
DummyWS.CLOSED = CLOSED;

module.exports = DummyWS;
module.exports.WebSocket = DummyWS;
module.exports.default = DummyWS;
module.exports.OPEN = OPEN;
module.exports.CONNECTING = CONNECTING;
module.exports.CLOSING = CLOSING;
module.exports.CLOSED = CLOSED;
