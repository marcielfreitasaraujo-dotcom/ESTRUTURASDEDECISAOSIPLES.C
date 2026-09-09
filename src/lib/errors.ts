export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly expose: boolean;

  constructor(code: string, message: string, status = 400, expose = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Faça login para continuar.") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro não encontrado.") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Este registro já existe.") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Muitas tentativas. Aguarde um momento.") {
    super("RATE_LIMITED", message, 429);
    this.name = "RateLimitError";
  }
}

export function publicErrorMessage(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof AppError && error.expose) {
    return { status: error.status, code: error.code, message: error.message };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Algo deu errado. Tente novamente em instantes.",
  };
}
