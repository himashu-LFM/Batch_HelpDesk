"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(level, message, meta = {}) {
    const base = {
        level,
        message,
        timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify({ ...base, ...meta }));
}
