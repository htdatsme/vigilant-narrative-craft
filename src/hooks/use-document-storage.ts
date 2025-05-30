
import { useToast } from '@/hooks/use-toast';

export const useDocumentStorage = () => {
  const { toast } = useToast();

  const uploadDocument = async (file: File, userId?: string) => {
    try {
      // Simulate file upload
      const fileName = `${Date.now()}-${file.name}`;
      
      // Create a mock file path
      const mockPath = `uploads/${fileName}`;

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      return { path: mockPath };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const downloadDocument = async (filePath: string) => {
    try {
      // Simulate download
      const blob = new Blob(['Mock file content'], { type: 'application/pdf' });
      return blob;
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteDocument = async (filePath: string) => {
    try {
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getPublicUrl = (filePath: string) => {
    return `mock://storage/${filePath}`;
  };

  return {
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getPublicUrl
  };
};
