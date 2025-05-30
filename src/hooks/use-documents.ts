
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_status: string;
  created_at: string;
  updated_at: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // For now, return empty array since we don't have database
      setDocuments([]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (document: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newDoc: Document = {
        ...document,
        id: `doc_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setDocuments(prev => [newDoc, ...prev]);
      toast({
        title: "Success",
        description: "Document created successfully"
      });
      
      return newDoc;
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, ...updates, updated_at: new Date().toISOString() } : doc
      ));
      return documents.find(doc => doc.id === id);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
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

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments
  };
};
