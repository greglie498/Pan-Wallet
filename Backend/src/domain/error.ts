export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string
    ){
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad Request") {
        super(400, "BAD_REQUEST", message);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Authentication required.") {
        super(401, "UNAUTHORIZED", message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action.") {
        super(403, "FORBIDDEN", message);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(404, "NOT_FOUND", `${resource} not found.`);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict occurred.") {
        super(409, "CONFLICT", message);
    }
}

export class UnprocessableError extends AppError {
    constructor(message = "Unable to process the request.") {
        super(422, "UNPROCESSABLE", message);
    }
}

export class InternalServerError extends AppError {
    constructor(message = "An unexpected error occurred.") {
        super(500, "INTERNAL_SERVER_ERROR", message);
    }
}