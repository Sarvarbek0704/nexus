import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'GITHUB_CLIENT_ID_NOT_SET',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || 'GITHUB_CLIENT_SECRET_NOT_SET',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { username, emails, photos, id, displayName } = profile;
    const nameParts = (displayName || username || '').split(' ');
    const user = {
      providerId: String(id),
      email: emails?.[0]?.value || `${username}@github.com`,
      firstName: nameParts[0] || username,
      lastName: nameParts.slice(1).join(' ') || '',
      avatar: photos?.[0]?.value,
      provider: 'github',
      username,
    };
    done(null, user);
  }
}
