# Nextgen Digi Lab Backend API

A comprehensive Node.js/Express backend API for the Nextgen Digi Lab website with MongoDB integration, file uploads, and admin management.

## 🚀 Features

- **RESTful API** with full CRUD operations
- **MongoDB** integration with Mongoose ODM
- **File Upload** support with Multer
- **Email Integration** with Nodemailer
- **JWT Authentication** for admin routes
- **Rate Limiting** and security middleware
- **Auto-generated slugs** for SEO-friendly URLs
- **Search functionality** with text indexing
- **Image and document handling**
- **Comprehensive error handling**

## 📋 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/meta/categories` - Get categories

### Blogs
- `GET /api/blogs` - List all blogs
- `GET /api/blogs/featured` - Get featured blog
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create blog (Admin)
- `PUT /api/blogs/:id` - Update blog (Admin)
- `DELETE /api/blogs/:id` - Delete blog (Admin)
- `POST /api/blogs/:id/like` - Like a blog
- `GET /api/blogs/meta/categories` - Get categories
- `GET /api/blogs/meta/tags` - Get tags

### News & Events
- `GET /api/news` - List all news/events
- `GET /api/news/events` - Get upcoming events
- `GET /api/news/:id` - Get single news/event
- `POST /api/news` - Create news/event (Admin)
- `PUT /api/news/:id` - Update news/event (Admin)
- `DELETE /api/news/:id` - Delete news/event (Admin)

### Careers
- `GET /api/careers` - List job openings
- `GET /api/careers/:id` - Get single job opening
- `POST /api/careers` - Create job opening (Admin)
- `PUT /api/careers/:id` - Update job opening (Admin)
- `DELETE /api/careers/:id` - Delete job opening (Admin)
- `POST /api/careers/:id/apply` - Apply for job
- `GET /api/careers/meta/departments` - Get departments
- `GET /api/careers/meta/locations` - Get locations

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - List submissions (Admin)
- `GET /api/contact/:id` - Get single submission (Admin)
- `PUT /api/contact/:id` - Update submission (Admin)
- `POST /api/contact/:id/notes` - Add note (Admin)
- `DELETE /api/contact/:id` - Delete submission (Admin)
- `GET /api/contact/stats/summary` - Get statistics (Admin)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats (Admin)
- `GET /api/admin/verify` - Verify token (Admin)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ngdl
JWT_SECRET=your-super-secret-jwt-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Start MongoDB
Make sure MongoDB is running on your system.

### 4. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── models/           # Mongoose models
│   ├── Product.js
│   ├── Blog.js
│   ├── News.js
│   ├── Career.js
│   └── Contact.js
├── routes/           # API routes
│   ├── products.js
│   ├── blogs.js
│   ├── news.js
│   ├── careers.js
│   ├── contact.js
│   └── admin.js
├── uploads/          # File uploads directory
├── server.js         # Main server file
├── package.json      # Dependencies
└── .env.example      # Environment template
```

## 🔒 Authentication

Admin routes require JWT authentication. Include the token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer your-jwt-token'
}
```

### Login to get token:
```bash
POST /api/admin/login
{
  "username": "admin",
  "password": "admin123"
}
```

## 📤 File Uploads

The API supports file uploads for:
- **Products**: thumbnails, images, videos, brochures
- **Blogs**: featured images, content images
- **News**: featured images, gallery images

Files are stored in the `uploads/` directory and served statically.

### Upload Example:
```javascript
const formData = new FormData();
formData.append('title', 'Product Title');
formData.append('thumbnail', file);

fetch('/api/products', {
  method: 'POST',
  body: formData
});
```

## 📧 Email Integration

The contact form automatically sends:
1. **Notification email** to admin
2. **Auto-reply email** to user

Configure SMTP settings in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@nextgendigilab.com
```

## 🔍 Search & Filtering

### Search Products:
```bash
GET /api/products?search=automation&category=enterprise&status=available
```

### Filter Blogs:
```bash
GET /api/blogs?category=technology&featured=true&sort=-publishedAt
```

### Pagination:
```bash
GET /api/products?page=2&limit=10
```

## 🛡️ Security Features

- **Helmet.js** for security headers
- **Rate limiting** (100 requests per 15 minutes)
- **CORS** configuration
- **Input validation** with Joi
- **JWT authentication** for admin routes
- **File type validation** for uploads
- **MongoDB injection protection**

## 📊 Admin Dashboard

Access comprehensive statistics:
- Product counts by status
- Blog engagement metrics
- Contact form submissions
- Career application tracking
- Recent activity feeds

## 🚀 Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ngdl
JWT_SECRET=super-secure-random-string
ADMIN_PASSWORD=secure-admin-password
```

### PM2 Deployment:
```bash
npm install -g pm2
pm2 start server.js --name "ngdl-api"
pm2 startup
pm2 save
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific endpoint
curl -X GET http://localhost:5000/api/health
```

## 📝 API Response Format

### Success Response:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@nextgendigilab.com or create an issue in the repository.

---

**Nextgen Digi Lab Backend API** - Powering digital transformation with robust, scalable technology.
