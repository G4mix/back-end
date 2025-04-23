import { EventFrequency } from '@prisma/client'

export type PostInput = {
  userProfileId: string;
  title?: string;
  content?: string;
  links?: string[];
  tags?: string[];
  images?: Express.Multer.File[];
  event?: EventInput;
}

export type EventInput = {
  subject: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  frequency?: EventFrequency;
}