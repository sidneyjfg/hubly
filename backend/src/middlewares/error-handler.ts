import type { FastifyInstance, FastifyReply } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error";

type ErrorDetail = {
  field?: string;
  message: string;
};

type ValidationErrorWithDetails = Error & {
  statusCode?: number;
  validation?: Array<{
    instancePath?: string;
    message?: string;
    params?: {
      missingProperty?: string;
    };
  }>;
};

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details: ErrorDetail[] = []
): void {
  reply.status(statusCode).send({
    success: false,
    code,
    message,
    details,
    error: {
      code,
      message,
      details
    }
  });
}

function getFastifyValidationDetails(error: ValidationErrorWithDetails): ErrorDetail[] {
  return (error.validation ?? []).map((item) => {
    const missingProperty = item.params?.missingProperty;
    const path = item.instancePath?.replace(/^\//, "").replace(/\//g, ".");
    const field = missingProperty ? [path, missingProperty].filter(Boolean).join(".") : path;
    const detail: ErrorDetail = {
      message: item.message ?? "Campo inválido."
    };

    if (field) {
      detail.field = field;
    }

    return detail;
  });
}

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      sendError(reply, error.statusCode, error.code, error.message);
      return;
    }

    if (error instanceof ZodError) {
      sendError(
        reply,
        400,
        "validation.invalid_input",
        "A requisição possui campos inválidos.",
        error.issues.map((issue) => {
          const field = issue.path.join(".");
          const detail: ErrorDetail = {
            message: issue.message
          };

          if (field) {
            detail.field = field;
          }

          return detail;
        })
      );
      return;
    }

    const validationError = error as ValidationErrorWithDetails;
    if (validationError.validation) {
      sendError(
        reply,
        validationError.statusCode ?? 400,
        "validation.invalid_input",
        "A requisição possui campos inválidos.",
        getFastifyValidationDetails(validationError)
      );
      return;
    }

    app.log.error(error);
    sendError(reply, 500, "internal.server_error", "Não foi possível processar a solicitação.");
  });
};
