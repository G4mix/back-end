import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  PutPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { InvalidImageType } from 'src/shared/errors';

export const S3_CLIENT = Symbol('S3_CLIENT');

export const SUPPORTED_IMAGES = {
  'image/jpg': '.jpg',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

type File = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer<ArrayBufferLike>;
};

export const fileInterceptorOptions: MulterOptions = {
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (
    _req,
    file: File,
    callback: (value: Error | null, boolean) => void,
  ) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new InvalidImageType(), false);
    }
    callback(null, true);
  },
};

@Injectable()
export class S3Gateway {
  constructor(@Inject(S3_CLIENT) private s3: S3Client) {}

  public async uploadFile({
    bucketName,
    key,
    file,
  }: {
    bucketName: string;
    key: string;
    file: Buffer;
  }) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
    });

    try {
      await this.s3.send(command);
      return { fileUrl: `https://${bucketName}.s3.amazonaws.com/${key}` };
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return errorMessage;
    }
  }

  public async deleteObject(bucketName: string, keys: string[]) {
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: keys?.map((key) => ({ Key: key })),
      },
    });

    try {
      return (await this.s3.send(command)).Deleted ?? [];
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return errorMessage;
    }
  }

  public async deleteFolder(bucketName: string, folderPrefix: string) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: folderPrefix,
      });
      const listedObjects = await this.s3.send(listCommand);
      console.log(listedObjects);

      if (listedObjects.Contents?.length) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key! })),
          },
        };
        console.log(deleteParams);

        const deleteCommand = new DeleteObjectsCommand(deleteParams);
        const deleteResult = await this.s3.send(deleteCommand);
        console.log('Deleted objects:', deleteResult.Deleted);
      } else {
        console.log('No objects found to delete.');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  }

  public async initializeBuckets() {
    const buckets = await this.listBuckets();
    if (!('gamix-public' in buckets)) {
      await this.createBucket({ bucketName: 'gamix-public' });
      await this.disablePublicAccess({ bucketName: 'gamix-public' });
      await this.putBucketPolicyAllowGet({ bucketName: 'gamix-public' });
    }
  }

  private async listBuckets() {
    const listBucketsCommand = new ListBucketsCommand({});
    return (await this.s3.send(listBucketsCommand)).Buckets ?? [];
  }

  private async createBucket({ bucketName }: { bucketName: string }) {
    const createBucketCommand = new CreateBucketCommand({ Bucket: bucketName });
    return await this.s3.send(createBucketCommand);
  }

  private async disablePublicAccess({ bucketName }: { bucketName: string }) {
    const putPublicAccessBlockCommand = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    });
    await this.s3.send(putPublicAccessBlockCommand);
  }

  private putBucketPolicyAllowGet({ bucketName }: { bucketName: string }) {
    const putBucketPolicyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: `Statment-${bucketName}`,
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`,
          },
        ],
      }),
    });
    return this.s3.send(putBucketPolicyCommand);
  }
}
