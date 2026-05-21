import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * DemoGuard — blocks any mutating request (POST, PATCH, PUT, DELETE)
 * from demo accounts. Demo users can only READ (GET).
 */
@Injectable()
export class DemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.isDemo) {
      const method = request.method?.toUpperCase();
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        throw new ForbiddenException(
          'Demo accounts are read-only. Please register a real account to perform this action.',
        );
      }
    }

    return true;
  }
}
