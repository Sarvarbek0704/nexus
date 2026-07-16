import {
  IsEmail, IsString, MinLength, MaxLength, IsIn,
  IsOptional, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../database/entities/user.entity';

/**
 * The roles a stranger may give themselves at the front door.
 *
 * `UserRole` also contains ADMIN, and this field used to validate against the
 * whole enum — so `{"role":"admin"}` on a public registration endpoint was a
 * valid request, and `auth.service.ts` stored it verbatim. The validator was
 * doing its job correctly; it was being asked the wrong question.
 *
 * Anything privileged is granted, never claimed. Keep it that way: this list
 * is an allow-list, not a copy of the enum minus one.
 */
export const SELF_ASSIGNABLE_ROLES = [
  UserRole.CLIENT,
  UserRole.FREELANCER,
  UserRole.AGENCY_OWNER,
] as const;

export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    enum: SELF_ASSIGNABLE_ROLES,
    example: UserRole.FREELANCER,
    description: 'Admin is granted, not requested — it is rejected here.',
  })
  @IsOptional()
  @IsIn(SELF_ASSIGNABLE_ROLES as readonly string[], {
    message: `role must be one of: ${SELF_ASSIGNABLE_ROLES.join(', ')}`,
  })
  role?: SelfAssignableRole;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  country?: string;
}
