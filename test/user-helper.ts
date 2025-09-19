import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { hashSync } from 'bcrypt';

export async function createTestUserWithRelations(
  userRepository: Repository<User>,
  userCodeRepository: Repository<UserCode>,
  userProfileRepository: Repository<UserProfile>,
  username: string,
  email: string,
  password: string,
): Promise<{ user: User; userCode: UserCode; userProfile: UserProfile }> {
  // Create UserCode first
  const userCode = await userCodeRepository.save({
    code: null,
  });

  // Create UserProfile
  const userProfile = await userProfileRepository.save({
    displayName: username,
    icon: null,
    autobiography: null,
    backgroundImage: null,
  });

  // Create User with relationships
  const hashedPassword = hashSync(password, 10);
  const user = await userRepository.save({
    username,
    email,
    password: hashedPassword,
    verified: true,
    userCodeId: userCode.id,
    userProfileId: userProfile.id,
  });

  return { user, userCode, userProfile };
}
