# AWS Deployment Guide for LeaderTalk

This guide walks through the step-by-step process of deploying the LeaderTalk application to AWS. We'll use a combination of AWS services to create a scalable, secure, and cost-effective production environment.

## Prerequisites

Before you begin, ensure you have:

- An AWS account with appropriate permissions
- AWS CLI installed and configured
- Node.js (v18+) and NPM
- Git
- Basic familiarity with AWS services

## Architecture Overview

Our AWS deployment uses the following services:

- **AWS Elastic Beanstalk**: For hosting the Node.js application
- **Amazon RDS**: For PostgreSQL database
- **Amazon S3**: For audio file storage
- **Amazon CloudFront**: For content delivery
- **AWS Lambda**: For background processing tasks (optional)
- **Amazon CloudWatch**: For monitoring and logging
- **AWS Certificate Manager**: For SSL/TLS certificates

## Step 1: Database Setup with Amazon RDS

1. **Create a PostgreSQL database**:

   a. Navigate to the RDS console in AWS
   
   b. Click "Create database"
   
   c. Select "Standard create" and choose PostgreSQL
   
   d. Under "Templates", select "Free tier" if suitable for your needs
   
   e. Configure settings:
      - DB instance identifier: `leadertalk-db`
      - Master username: Choose a username
      - Master password: Choose a strong password
   
   f. Under "Connectivity", ensure "Public access" is set to "No" for production environments
   
   g. Create a new VPC security group or select an existing one
   
   h. Configure additional settings:
      - Initial database name: `leadertalk`
      - Enable automated backups
      - Select appropriate retention period
   
   i. Click "Create database"

2. **Note your database credentials**:
   
   After the database is created, note these details:
   - Endpoint (hostname)
   - Port (default 5432)
   - Master username
   - Master password
   - Database name

## Step 2: S3 Setup for Audio Storage

1. **Create an S3 bucket**:

   a. Navigate to S3 console
   
   b. Click "Create bucket"
   
   c. Name the bucket (e.g., `leadertalk-audio-files`)
   
   d. Select appropriate region (should be the same as your RDS)
   
   e. Configure settings:
      - Block all public access (recommended for production)
      - Enable bucket versioning
      - Enable encryption (use Amazon S3-managed keys for simplicity)
   
   f. Click "Create bucket"

2. **Create IAM policy for S3 access**:

   a. Go to IAM console
   
   b. Select "Policies" and click "Create policy"
   
   c. Use the JSON editor to create a policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:ListBucket",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::leadertalk-audio-files",
           "arn:aws:s3:::leadertalk-audio-files/*"
         ]
       }
     ]
   }
   ```
   
   d. Name the policy `LeaderTalkS3AccessPolicy` and click "Create policy"

## Step 3: Application Preparation

1. **Update environment configuration**:

   Create a `.env.production` file with these settings:
   ```
   # Database
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/leadertalk
   PGHOST=your-rds-endpoint
   PGPORT=5432
   PGUSER=your-master-username
   PGPASSWORD=your-master-password
   PGDATABASE=leadertalk
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Firebase
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   
   # AWS
   AWS_S3_BUCKET=leadertalk-audio-files
   AWS_REGION=your-aws-region
   ```

2. **Update code for S3 integration**:

   If your application stores audio files locally, modify the storage logic to use the S3 bucket instead.

3. **Build the application**:

   Run the build command to compile the application:
   ```bash
   npm run build
   ```

## Step 4: Elastic Beanstalk Setup

1. **Initialize Elastic Beanstalk**:

   a. Install EB CLI if not already installed:
   ```bash
   pip install awsebcli
   ```
   
   b. Initialize EB in your project:
   ```bash
   eb init
   ```
   
   c. Follow prompts to select:
      - Region (match your RDS region)
      - Application name (`leadertalk`)
      - Platform (Node.js)
      - Latest platform version
      - Set up SSH for instances (recommended)

2. **Configure EB environment**:

   a. Create a file named `.ebextensions/nodecommand.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm start"
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       # Other environment variables can be set here or through the EB console
   ```

   b. Create a file named `Procfile`:
   ```
   web: npm start
   ```

3. **Create the EB environment**:

   ```bash
   eb create leadertalk-production --scale 1 -i t2.micro
   ```

4. **Configure environment variables via EB console**:

   a. Go to Elastic Beanstalk console
   
   b. Select your application and environment
   
   c. Go to Configuration → Software
   
   d. Under "Environment properties", add all variables from your `.env.production` file
   
   e. Apply changes

5. **Attach the S3 access policy**:

   a. In Elastic Beanstalk console, go to Configuration → Security
   
   b. Edit the IAM instance profile
   
   c. Attach the `LeaderTalkS3AccessPolicy` created earlier

## Step 5: Database Migration

1. **Set up the database schema**:

   a. SSH into the Elastic Beanstalk instance:
   ```bash
   eb ssh
   ```
   
   b. Run database migrations:
   ```bash
   cd /var/app/current
   npm run db:push
   ```
   
   Alternatively, you can create a deployment hook in `.ebextensions` to automate this step.

## Step 6: DNS and SSL Setup

1. **Configure custom domain** (optional):

   a. Register a domain through Route 53 or use an existing domain
   
   b. Create a new record set pointing to your Elastic Beanstalk environment URL
   
   c. In Elastic Beanstalk, add your domain to the environment configuration

2. **Set up SSL with AWS Certificate Manager**:

   a. Go to AWS Certificate Manager
   
   b. Request a public certificate for your domain
   
   c. Validate the certificate (usually through DNS validation)
   
   d. Once validated, go to your Elastic Beanstalk configuration
   
   e. Under "Load balancer", configure HTTPS listener and select your certificate

## Step 7: CloudFront Setup (Optional)

For improved performance and reduced costs:

1. Create a CloudFront distribution:
   
   a. Go to CloudFront console
   
   b. Create a new distribution
   
   c. For "Origin Domain Name", select your Elastic Beanstalk environment URL
   
   d. Configure cache and security settings as needed
   
   e. For "Alternate Domain Names", add your custom domain
   
   f. Under "SSL Certificate", select the certificate created in ACM
   
   g. Create distribution

2. Update your DNS record to point to the CloudFront distribution instead of directly to Elastic Beanstalk.

## Step 8: Firebase Configuration

1. **Update Firebase authorized domains**:

   a. Go to the Firebase console
   
   b. Navigate to Authentication → Settings → Authorized domains
   
   c. Add your production domain to the list

## Step 9: Monitoring and Maintenance

1. **Set up CloudWatch Alarms**:

   a. Go to CloudWatch console
   
   b. Create alarms for:
      - CPU utilization
      - Memory usage
      - Application errors
      - Response times
   
   c. Configure notifications via SNS

2. **Set up AWS Backup**:

   Schedule regular backups of your RDS database.

3. **Review and optimize**:

   - Monitor costs regularly
   - Adjust instance sizes based on actual usage
   - Optimize database queries
   - Consider using AWS Lambda for background tasks

## Deployment Scripts (Optional)

Create a deployment script to automate the process:

```bash
#!/bin/bash
# deploy.sh

# Build the application
npm run build

# Run tests
npm test

# Deploy to Elastic Beanstalk
eb deploy leadertalk-production

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Errors**:
   - Verify security group settings
   - Check database credentials
   - Ensure the RDS instance is in the same VPC as Elastic Beanstalk

2. **Application Startup Failures**:
   - Check Elastic Beanstalk logs
   - Verify environment variables
   - Ensure `npm start` works locally

3. **S3 Access Issues**:
   - Verify IAM permissions
   - Check bucket name and region
   - Confirm environment variables are set correctly

## Scaling Considerations

As your application grows:

1. **Horizontal Scaling**:
   - Increase the number of instances in your Elastic Beanstalk environment
   - Consider using Auto Scaling groups

2. **Database Scaling**:
   - Upgrade RDS instance type
   - Implement read replicas
   - Consider database sharding for very large datasets

3. **Caching**:
   - Implement Redis or Memcached using ElastiCache
   - Cache frequently accessed data

## Security Best Practices

1. **Regular Updates**:
   - Keep Node.js and all dependencies updated
   - Apply security patches promptly

2. **Data Protection**:
   - Encrypt sensitive data at rest and in transit
   - Implement proper access controls

3. **Monitoring**:
   - Set up logging for security events
   - Implement intrusion detection

4. **Authentication**:
   - Use strong passwords
   - Implement multi-factor authentication for AWS console
   - Regularly rotate access keys

## Cost Optimization

1. **Right-sizing**:
   - Match instance types to actual workload
   - Scale down during periods of low usage

2. **Reserved Instances**:
   - Purchase reserved instances for predictable workloads

3. **S3 Lifecycle Policies**:
   - Implement lifecycle policies to move older audio files to cheaper storage classes

## Conclusion

Following this guide, you've deployed LeaderTalk to AWS in a scalable, secure manner. Regular monitoring and maintenance will ensure optimal performance and user experience.

For specific AWS service documentation, refer to the AWS official documentation.