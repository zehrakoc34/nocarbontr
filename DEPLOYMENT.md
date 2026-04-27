# Score3 CBAM - Deployment Guide

This guide covers deploying Score3 CBAM to various platforms.

## Prerequisites

- Node.js 22+
- PostgreSQL 14+ (for production)
- Docker (optional, for containerized deployment)
- Git

## Local Development

```bash
# Clone repository
git clone <repository-url>
cd score3-cbam

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit migrate

# Seed database
pnpm tsx drizzle/seed.ts

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t score3-cbam:latest .

# Tag for registry
docker tag score3-cbam:latest your-registry/score3-cbam:latest

# Push to registry
docker push your-registry/score3-cbam:latest
```

### Run with Docker Compose

```bash
# Create .env file with production values
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Vercel Deployment

### Prerequisites
- Vercel account
- PostgreSQL database (use Vercel Postgres or external provider)

### Steps

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add VITE_APP_ID
   # ... add all required variables
   ```

3. **Deploy**
   ```bash
   vercel deploy --prod
   ```

4. **Run Migrations**
   ```bash
   vercel env pull
   pnpm drizzle-kit migrate
   ```

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "other",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "VITE_APP_ID": "@vite_app_id"
  }
}
```

## Netlify Deployment

### Prerequisites
- Netlify account
- PostgreSQL database

### Steps

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Select your repository

2. **Build Settings**
   - Build command: `pnpm run build`
   - Publish directory: `dist`
   - Functions directory: `dist`

3. **Environment Variables**
   - Go to Site Settings → Environment
   - Add all required variables

4. **Deploy**
   - Push to main branch or manually trigger deploy

### Netlify Configuration (netlify.toml)

```toml
[build]
command = "pnpm run build"
functions = "dist"
publish = "dist"

[functions]
node_bundler = "esbuild"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

## AWS Deployment

### Using EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow ports 80, 443, 3000

2. **Install Dependencies**
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Deploy Application**
   ```bash
   git clone <repository-url>
   cd score3-cbam
   docker-compose up -d
   ```

4. **Set Up Reverse Proxy (Nginx)**
   ```bash
   sudo apt install nginx
   sudo systemctl start nginx
   ```

### Using ECS (Elastic Container Service)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name score3-cbam
   ```

2. **Build and Push Image**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker build -t score3-cbam .
   docker tag score3-cbam:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/score3-cbam:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/score3-cbam:latest
   ```

3. **Create ECS Task Definition**
   - Use the ECR image URL
   - Set environment variables
   - Configure port mapping (3000:3000)

4. **Create ECS Service**
   - Select task definition
   - Configure load balancer
   - Set desired count to 2+ for HA

## Google Cloud Deployment

### Using Cloud Run

1. **Build and Push Image**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/score3-cbam
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy score3-cbam \
     --image gcr.io/PROJECT_ID/score3-cbam \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=<your-database-url> \
     --memory 512Mi \
     --cpu 1
   ```

### Using Compute Engine

Similar to AWS EC2 - use Docker Compose for deployment.

## Database Setup

### PostgreSQL on AWS RDS

1. **Create RDS Instance**
   - Engine: PostgreSQL 16
   - Instance class: db.t3.micro or larger
   - Multi-AZ: Yes (for production)
   - Backup retention: 30 days

2. **Connect and Migrate**
   ```bash
   export DATABASE_URL="postgresql://user:password@rds-endpoint:5432/score3cbam"
   pnpm drizzle-kit migrate
   pnpm tsx drizzle/seed.ts
   ```

### PostgreSQL on Azure

1. **Create Azure Database for PostgreSQL**
   - Server name: score3-cbam
   - Admin username: dbadmin
   - Password: (strong password)

2. **Configure Firewall**
   - Allow Azure services
   - Add your IP

3. **Connect and Migrate**
   ```bash
   export DATABASE_URL="postgresql://dbadmin:password@server.postgres.database.azure.com:5432/score3cbam"
   pnpm drizzle-kit migrate
   pnpm tsx drizzle/seed.ts
   ```

## SSL/TLS Certificate

### Using Let's Encrypt with Nginx

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### Using AWS Certificate Manager

1. Request certificate for your domain
2. Validate domain ownership
3. Attach to load balancer

## Monitoring & Logging

### Application Logs

```bash
# Docker Compose
docker-compose logs -f app

# Vercel
vercel logs

# Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=score3-cbam"
```

### Performance Monitoring

- Set up CloudWatch (AWS) or Cloud Monitoring (GCP)
- Configure alerts for:
  - High CPU usage
  - High memory usage
  - Database connection errors
  - API response time > 1s

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Automated backups (AWS RDS)
- Enable automated backups
- Set retention to 30 days
- Enable backup encryption

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### File Storage Backups

- S3 has built-in versioning and replication
- Enable cross-region replication for disaster recovery

## Security Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Use HTTPS/SSL for all connections
- [ ] Enable database encryption
- [ ] Set up firewall rules
- [ ] Enable CORS only for trusted domains
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up DDoS protection
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Use strong database passwords
- [ ] Enable audit logging

## Performance Optimization

### Frontend
- Enable gzip compression
- Minify CSS/JS
- Lazy load components
- Use CDN for static assets

### Backend
- Enable query caching
- Use database indexes
- Implement rate limiting
- Use connection pooling

### Database
- Add indexes on frequently queried columns
- Analyze query performance
- Archive old data
- Use read replicas for reporting

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection string format
# postgresql://user:password@host:port/database
```

### High Memory Usage
- Check for memory leaks
- Increase instance size
- Enable caching
- Archive old data

### Slow API Response
- Check database query performance
- Enable caching
- Add database indexes
- Scale horizontally

## Support

For deployment issues, contact support@score3cbam.com or check our documentation at https://docs.score3cbam.com
