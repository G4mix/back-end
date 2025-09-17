export class UserProfileDto {
  id: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  links: { id: string; url: string; label: string }[] = [];
  isFollowing?: boolean;
  followers: number = 0;
  following: number = 0;

  static fromEntity(profile: any, currentUserId?: string): UserProfileDto {
    const dto = new UserProfileDto();
    dto.id = profile.id;
    dto.username = profile.displayName ?? profile.id;
    dto.bio = profile.autobiography ?? null;
    dto.avatarUrl = profile.icon ?? null;
    dto.links =
      profile.links?.map((l) => ({
        id: l.id,
        url: l.url,
        label: l.label ?? '',
      })) || [];
    dto.followers = profile.followers?.length ?? 0;
    dto.following = profile.following?.length ?? 0;
    dto.isFollowing = currentUserId
      ? profile.followers?.some((f) => f.followerUserId === currentUserId)
      : undefined;
    return dto;
  }
}

export class UserCodeDto {
  id: string;
  code: string;
  createdAt: Date;

  static fromEntity(code: any): UserCodeDto | null {
    if (!code) return null;
    const dto = new UserCodeDto();
    dto.id = code.id;
    dto.code = code.code;
    dto.createdAt = code.created_at;
    return dto;
  }
}

export class UserDto {
  id: string;
  email: string;
  verified: boolean;
  userProfile: UserProfileDto;
  userCode: UserCodeDto | null;

  static fromEntity(user: any, currentUserId?: string): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.verified = user.verified;
    dto.userProfile = UserProfileDto.fromEntity(
      user.userProfile,
      currentUserId,
    );
    dto.userCode = UserCodeDto.fromEntity(user.userCode);
    return dto;
  }
}
