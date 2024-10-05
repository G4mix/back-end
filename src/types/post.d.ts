export type PostInput = {
  userProfileId: string;
  title?: string;
  content?: string;
  links?: string[];
  tags?: string[];
  images?: Express.Multer.File[];
}
