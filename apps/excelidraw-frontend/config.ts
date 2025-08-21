export function getHost() {
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
        return window.location.hostname;
    }
    return "localhost";
}

export function getPort() {
    if (typeof window !== "undefined" && window.location && window.location.port) {
        return window.location.port;
    }
    return "3001"; // Default to 3001 since that's what's running
}

export function getBackendUrl() {
    return `http://${getHost()}:3002`;
}

export function getWsUrl() {
    return `ws://${getHost()}:8081`;
}

export function getRoomUrl() {
    return `http://${getHost()}:${getPort()}`;
}

export function getExileUrl() {
    return `http://${getHost()}:${getPort()}/canvas`;
}