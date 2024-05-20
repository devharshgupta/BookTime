import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      isSuccess: false,
      data:
        exception instanceof HttpException
          ? exception.getResponse()
          : {
              statusCode: status,
              timestamp: new Date().toISOString(),
              path: request.url,
              message: (exception as any).message || 'Internal server error',
            },
    };

    response.status(status).json(errorResponse);
  }
}
