

export class TypeError extends Error {
    constructor(message) {
        super(message);
    }
}

export class RedeclarationError extends TypeError {
    constructor(message) {
        super(message);
    }
}

export class UndeclaredError extends TypeError {
    constructor(message) {
        super(message);
    }
}