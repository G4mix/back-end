import { User } from 'src/entities/user.entity';
import { hashSync } from 'bcrypt';
import { Idea } from 'src/entities/idea.entity';
import { Comment } from 'src/entities/comment.entity';
import { DeepPartial } from 'typeorm';

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

export async function createTestIdea(
  title: string,
  content: string,
  authorId: string,
  comments: DeepPartial<Comment>[],
): Promise<Idea> {
  const idea = await ideaRepository.save({
    // ideaId: `test-idea-${Math.random().toString(36).substring(2,15)}`,
    title,
    content,
    authorId,
    comments: comments,
  });

  return idea;
}
