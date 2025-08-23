export function getHost() {
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
        return window.location.hostname;
    }
    return "localhost";
}

export function getBackendUrl() {
    return `http://${getHost()}:3002`;
}

export function getWsUrl() {
    return `ws://${getHost()}:8081`;
}

export function getRoomUrl() {
    return `http://${getHost()}:3000`;
}

export function getExileUrl() {
    return `http://${getHost()}:3001/canvas`;
}

export function getMLBackendUrl() {
    return `http://${getHost()}:3003`;
}