import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * DemoGuard — blocks any mutating request (POST, PATCH, PUT, DELETE)
 * from demo accounts. Demo users can only READ (GET).
 * Reads isDemo from JWT payload (no DB query needed).
 */
@Injectable()
export class DemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return true;
    }

    // Get isDemo from already-populated request.user OR decode JWT payload manually
    let isDemo: boolean = request.user?.isDemo ?? false;

    if (!isDemo) {
      const authHeader = request.headers?.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          // Decode payload without verification (just inspect isDemo flag)
          const payloadBase64 = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
          isDemo = payload?.isDemo ?? false;
        } catch {
          // invalid token — let JwtAuthGuard handle it
        }
      }
    }

    if (isDemo) {
      throw new ForbiddenException(
        'Demo accounts are read-only. Please register a real account to perform this action.',
      );
    }

    return true;
  }
}
