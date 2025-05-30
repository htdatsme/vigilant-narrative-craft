# Simplify Canvig - AI-Powered Healthcare Document Processing

[![Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff5722.svg)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com/)

## Overview

Simplify Canvig is a comprehensive AI-powered application designed for processing Canada Vigilance adverse event reports. The application provides secure document processing, data extraction, narrative generation, and comprehensive audit trails while maintaining strict healthcare compliance standards.

## 🚀 Features

### Core Functionality
- **📄 Document Processing**: Upload and process PDF Canada Vigilance reports
- **🔍 AI Data Extraction**: Intelligent extraction of structured data from medical documents
- **📝 Narrative Generation**: AI-powered case narrative creation
- **🔒 Security Scanning**: Automated PHI/PII detection and risk assessment
- **📊 Data Export**: Comprehensive data export capabilities
- **🛡️ Audit Trail**: Complete compliance logging and tracking

### Security & Compliance
- **PHI Detection**: Automated detection of Protected Health Information
- **Risk Assessment**: Multi-level security risk classification
- **Compliance Logging**: Comprehensive audit trails for regulatory compliance
- **Secure Storage**: Encrypted file storage with Supabase
- **Access Controls**: Role-based access and data protection

### User Experience
- **Responsive Design**: Mobile-first responsive interface
- **Real-time Progress**: Live processing status and progress tracking
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Toast Notifications**: User-friendly status updates and alerts
- **Loading States**: Smooth loading experiences throughout the app

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality, accessible component library
- **React Router**: Client-side routing and navigation
- **Lucide React**: Beautiful, customizable icons

### Backend & Database
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Supabase Storage**: Secure file storage and management
- **Supabase Edge Functions**: Serverless backend processing
- **Row Level Security (RLS)**: Database-level security policies

### State Management & Data Fetching
- **TanStack Query**: Powerful data synchronization and caching
- **Custom Hooks**: Reusable state management patterns
- **Real-time Updates**: Live data synchronization

### Development Tools
- **Vite**: Fast build tool and development server
- **ESLint**: Code linting and quality assurance
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing and optimization

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── Dashboard.tsx    # Main dashboard interface
│   ├── DocumentProcessor.tsx  # Document upload and processing
│   ├── CaseNarrativeEditor.tsx  # Narrative editing interface
│   ├── AuditTrail.tsx   # Compliance and audit logging
│   ├── DataExport.tsx   # Data export functionality
│   └── ErrorBoundary.tsx  # Error handling
├── hooks/               # Custom React hooks
│   ├── use-documents.ts # Document management
│   ├── use-extractions.ts  # Data extraction
│   ├── use-narratives.ts   # Narrative management
│   ├── use-document-storage.ts  # File storage
│   └── use-processing-logs.ts   # Audit logging
├── utils/               # Utility functions
│   ├── security.ts      # Security and PHI detection
│   ├── progressTracking.ts  # Processing progress
│   ├── exportUtils.ts   # Data export utilities
│   └── errorHandling.ts # Error handling utilities
├── pages/               # Application pages
│   ├── Index.tsx        # Main application page
│   └── NotFound.tsx     # 404 error page
└── integrations/        # External service integrations
    └── supabase/        # Supabase configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm))
- Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd simplify-canvig
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL migrations (provided in the application)
   - Configure storage buckets and policies

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📋 Database Schema

The application uses the following main tables:

### `documents`
- Stores uploaded document metadata
- Tracks upload status and file information
- Links to Supabase Storage for file content

### `extractions`
- Contains AI-extracted data from documents
- Stores both raw and processed data
- Includes security scan results

### `narratives`
- Generated case narratives
- Links to extraction data
- Supports versioning and templates

### `processing_logs`
- Comprehensive audit trail
- Compliance logging
- Processing status tracking

## 🔧 Configuration

### Environment Variables
The application uses Supabase configuration which is automatically set up through the Lovable integration.

### Storage Configuration
- Documents are stored in the `documents` bucket
- Public read access for processed documents
- Secure upload policies

## 🧪 Testing

### Manual Testing Checklist
- [ ] Document upload functionality
- [ ] Processing simulation and progress tracking
- [ ] Security scanning and PHI detection
- [ ] Data extraction and storage
- [ ] Narrative generation and editing
- [ ] Data export in multiple formats
- [ ] Audit trail logging
- [ ] Error handling and recovery

### Automated Testing
```bash
# Run tests (when implemented)
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📊 Performance Optimizations

### Bundle Optimization
- Tree shaking for optimal bundle size
- Code splitting with React.lazy (ready for implementation)
- Asset optimization with Vite

### Runtime Performance
- Efficient re-rendering with React hooks
- Optimized database queries with proper indexing
- Image and file compression

### Caching Strategy
- TanStack Query for intelligent data caching
- Browser caching for static assets
- Supabase connection pooling

## 🔒 Security Features

### Data Protection
- **PHI Detection**: Automated scanning for Protected Health Information
- **Risk Classification**: Multi-level risk assessment (LOW, MEDIUM, HIGH)
- **Encryption**: Data encryption at rest and in transit
- **Access Controls**: User-based access permissions

### Compliance
- **Audit Trails**: Comprehensive logging for regulatory compliance
- **Data Retention**: Configurable data retention policies
- **Export Controls**: Secure data export with audit logging

## 🚀 Deployment

### Lovable Deployment
1. Open your project in [Lovable](https://lovable.dev)
2. Click "Share" → "Publish"
3. Your app will be deployed automatically

### Custom Domain
To connect a custom domain:
1. Navigate to Project → Settings → Domains
2. Click "Connect Domain"
3. Follow the configuration steps

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use existing component patterns
3. Maintain responsive design principles
4. Add proper error handling
5. Include comprehensive logging

### Code Style
- Use Prettier for code formatting
- Follow ESLint configuration
- Use semantic commit messages
- Maintain component documentation

## 📈 Monitoring & Analytics

### Error Tracking
- Comprehensive error boundaries
- Detailed error logging
- User-friendly error messages

### Performance Monitoring
- Processing time tracking
- Database query optimization
- Real-time performance metrics

## 🔄 Data Flow

1. **Document Upload**: Users upload PDF files through drag-and-drop interface
2. **Security Scan**: Automated PHI/PII detection and risk assessment
3. **Data Extraction**: AI-powered extraction of structured data
4. **Storage**: Secure storage in Supabase with proper access controls
5. **Narrative Generation**: AI-generated case narratives
6. **Export**: Multi-format data export with audit logging

## 📝 API Documentation

### Custom Hooks
- `useDocuments`: Document management and storage
- `useExtractions`: Data extraction and processing
- `useNarratives`: Narrative generation and editing
- `useDocumentStorage`: File upload and storage
- `useProcessingLogs`: Audit trail and logging

## 🆘 Troubleshooting

### Common Issues
1. **Upload Failures**: Check file format (PDF only) and size limits
2. **Processing Errors**: Verify Supabase connection and permissions
3. **Display Issues**: Check browser compatibility and console errors

### Debug Mode
Enable development mode for detailed logging:
```bash
npm run dev
```

## 📞 Support

For technical support or questions:
- Check the [Lovable Documentation](https://docs.lovable.dev)
- Review the troubleshooting section
- Contact support through the Lovable platform

## 📄 License

This project is built with Lovable and follows standard software licensing practices.

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
