import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'GOOGLE_CLIENT_ID_NOT_SET',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'GOOGLE_CLIENT_SECRET_NOT_SET',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:5000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const user = {
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0]?.value,
      provider: 'google',
    };
    done(null, user);
  }
}
