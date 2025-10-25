import { User } from 'src/entities/user.entity';
import { hashSync } from 'bcrypt';

export async function createTestUser(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  const profile = await profileRepository.save({
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
    profileId: profile.id,
  });

  return user;
}
