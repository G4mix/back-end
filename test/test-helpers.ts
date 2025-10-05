import { User } from 'src/entities/user.entity';
import { hashSync } from 'bcrypt';

export async function createTestUser(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  const userCode = await userCodeRepository.save({
    code: null,
  });

  const userProfile = await userProfileRepository.save({
    displayName: username,
    icon: null,
    autobiography: null,
    backgroundImage: null,
  });

  const hashedPassword = hashSync(password, 10);
  const user = await userRepository.save({
    username,
    email,
    password: hashedPassword,
    verified: true,
    userCodeId: userCode.id,
    userProfileId: userProfile.id,
  });

  return user;
}
