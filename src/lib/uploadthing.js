import { createUploadthing } from 'uploadthing/server';

const f = createUploadthing();

// Fake auth function - replace with your actual auth
const auth = (req) => ({ id: 'fakeId' });

export const uploadRouter = {
  // For task attachments - images and documents
  taskAttachment: f({
    image: { maxFileSize: '4MB', maxFileCount: 5 },
    pdf: { maxFileSize: '8MB', maxFileCount: 3 },
    text: { maxFileSize: '2MB', maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);
      return { uploadedBy: metadata.userId };
    }),

  // For project attachments - larger files
  projectAttachment: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    'application/zip': { maxFileSize: '32MB', maxFileCount: 2 },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Project upload complete:', file.url);
      return { uploadedBy: metadata.userId };
    }),
};

export const ourFileRouter = uploadRouter;