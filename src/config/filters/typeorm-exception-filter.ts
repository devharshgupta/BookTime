import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeORMExceptionFilter implements ExceptionFilter {
  // This filters captures all typeorm erros and throw them with proper http code
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = HttpStatus.BAD_REQUEST; // You can adjust the status code

    response.status(status).json({
      statusCode: status,
      message: 'TypeORM Error',
      error: exception.message, // Include the TypeORM error message
    });
  }
}
