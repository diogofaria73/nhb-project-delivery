import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CannotDeleteActiveImportError,
  ImportNotFoundError,
  ImportNotRestorableError,
  ImportSha256MismatchError,
  InvalidReferenceYearError,
  NoActiveImportError,
} from '../../domain/errors/project-tracking.errors';

type DomainError =
  | ImportNotFoundError
  | ImportSha256MismatchError
  | CannotDeleteActiveImportError
  | ImportNotRestorableError
  | NoActiveImportError
  | InvalidReferenceYearError;

@Catch(
  ImportNotFoundError,
  ImportSha256MismatchError,
  CannotDeleteActiveImportError,
  ImportNotRestorableError,
  NoActiveImportError,
  InvalidReferenceYearError,
)
export class ProjectTrackingExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }

  private statusFor(error: DomainError): number {
    if (error instanceof ImportNotFoundError) return HttpStatus.NOT_FOUND;
    if (error instanceof NoActiveImportError) return HttpStatus.NOT_FOUND;
    if (error instanceof CannotDeleteActiveImportError)
      return HttpStatus.CONFLICT;
    if (error instanceof ImportNotRestorableError) return HttpStatus.CONFLICT;
    if (error instanceof ImportSha256MismatchError) return HttpStatus.CONFLICT;
    if (error instanceof InvalidReferenceYearError)
      return HttpStatus.BAD_REQUEST;
    return HttpStatus.BAD_REQUEST;
  }
}
