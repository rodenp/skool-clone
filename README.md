# 🎓 Skool.com Clone - Advanced Learning Platform

A full-featured clone of Skool.com built with modern web technologies, featuring an advanced course creation system, community management, and rich content editing capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.9-green)

## ✨ Features

### 🎯 Course Creation System
- **Rich Text Editor** - TipTap-powered editor with formatting, media embedding, and code highlighting
- **Multiple Lesson Types** - Support for video, text, quiz, and assignment lessons
- **Drag & Drop Ordering** - Sortable lesson lists with react-beautiful-dnd
- **File Upload System** - Drag-and-drop uploads with progress tracking and validation
- **Media Gallery** - Asset management with search, filtering, and grid/list views
- **Course Preview** - Real-time preview of course structure and statistics

### 👥 Community Management
- **Community Creation** - Full community setup with pricing and privacy controls
- **Member Management** - User roles, permissions, and member directories
- **Discussion Posts** - Threaded discussions and engagement features
- **Leaderboards** - Gamification with points and levels

### 🔐 Authentication & User Management
- **NextAuth Integration** - Support for credentials, Google, and GitHub OAuth
- **User Profiles** - Comprehensive user management and onboarding
- **Role-Based Access** - Owner, admin, and member permission levels

### 🎨 User Interface
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Modern Components** - shadcn/ui component library
- **Dark/Light Theme** - Theme switching support
- **Professional UI** - Pixel-perfect recreation of Skool.com's design

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router with React Server Components
- **TypeScript** - Full type safety throughout
- **React 18** - Latest React features
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **TipTap** - Rich text editor
- **React Beautiful DnD** - Drag and drop functionality
- **React Dropzone** - File upload handling

### Backend
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **NextAuth** - Authentication system
- **Redux Toolkit** - State management
- **Bun** - Fast package manager and runtime

### Development
- **TypeScript** - Static typing
- **Biome** - Fast linting and formatting
- **ESLint** - Code quality
- **Turbopack** - Fast development builds

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database
- Environment variables (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skool-clone.git
   cd skool-clone
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

5. **Run the development server**
   ```bash
   bun run dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
skool-clone/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── app/               # Protected app pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui components
│   │   └── dashboard/        # Dashboard components
│   ├── lib/                  # Utilities and configurations
│   │   ├── api/              # RTK Query API slices
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   ├── hooks/                # Custom React hooks
│   └── providers/            # Context providers
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### Database Schema
The project uses Prisma with PostgreSQL. Key models include:
- **User** - User accounts and profiles
- **Community** - Learning communities
- **Course** - Course content and metadata
- **Module** - Course modules
- **Lesson** - Individual lessons
- **Enrollment** - User course enrollments

## 🧪 Development

### Available Scripts
```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run linting
bun run format       # Format code
```

### Code Quality
- **TypeScript** - Strict type checking
- **Biome** - Fast linting and formatting
- **ESLint** - Additional code quality rules
- **Prettier** - Code formatting

## 📈 Features Roadmap

### In Progress
- [ ] Quiz builder with multiple question types
- [ ] Assignment submission system
- [ ] Course progress tracking
- [ ] Video player integration

### Planned
- [ ] Payment integration (Stripe)
- [ ] Real-time notifications
- [ ] Mobile app support
- [ ] Advanced analytics
- [ ] Content moderation tools
- [ ] API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Skool.com](https://skool.com) - Original platform inspiration
- [shadcn/ui](https://ui.shadcn.com) - Beautiful component library
- [TipTap](https://tiptap.dev) - Excellent rich text editor
- [Prisma](https://prisma.io) - Amazing database toolkit

## 📞 Support

If you have any questions or need help, please open an issue or reach out to the community.

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
