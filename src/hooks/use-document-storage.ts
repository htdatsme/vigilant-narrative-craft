
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useDocumentStorage = () => {
  const { toast } = useToast();

  const uploadDocument = async (file: File, userId?: string) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `uploads/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      return { path: uploadData.path };
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
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;
      return data;
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
      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) throw error;

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
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getPublicUrl
  };
};
