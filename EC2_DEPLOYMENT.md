# EC2 Direct Deployment Guide for LeaderTalk

This guide provides step-by-step instructions for deploying the LeaderTalk application directly to an Amazon EC2 instance. This approach gives you more control over the server environment compared to managed services like Elastic Beanstalk.

## Prerequisites

Before starting, ensure you have:

- An AWS account with appropriate permissions
- AWS CLI installed and configured
- A key pair for SSH access to EC2 instances
- Basic understanding of Linux server administration
- Git and Node.js installed on your local machine

## Step 1: Launch an EC2 Instance

1. **Sign in to the AWS Management Console**

2. **Navigate to EC2 Dashboard**:
   - In the AWS Console, go to "Services" → "EC2"

3. **Launch a new instance**:
   - Click "Launch Instance"
   - Choose a name for your instance (e.g., "leadertalk-production")

4. **Select an Amazon Machine Image (AMI)**:
   - Select "Amazon Linux 2023" or "Ubuntu Server 22.04 LTS"
   - Choose the 64-bit (x86) architecture

5. **Choose an Instance Type**:
   - For a production environment, at least t3.small is recommended
   - For development/testing, t2.micro (eligible for free tier) is sufficient

6. **Configure Key Pair**:
   - Select an existing key pair or create a new one
   - Keep the private key file (.pem) secure

7. **Configure Network Settings**:
   - Create a new security group or select an existing one
   - Add the following rules:
     - SSH (port 22) from your IP address only
     - HTTP (port 80) from anywhere
     - HTTPS (port 443) from anywhere
     - Custom TCP (port 5000, or your app's port) from anywhere

8. **Configure Storage**:
   - Allocate at least 20 GB for the root volume
   - For production, consider adding additional EBS volumes

9. **Advanced Details** (optional):
   - Add tags for easier resource management
   - Configure monitoring options

10. **Review and Launch**:
    - Review all configurations
    - Click "Launch Instance"

## Step 2: Set Up RDS for PostgreSQL Database

1. **Navigate to RDS Console**:
   - In AWS Console, go to "Services" → "RDS"

2. **Create a new database**:
   - Click "Create database"
   - Choose "Standard create"
   - Select "PostgreSQL" engine

3. **Configure Settings**:
   - Under "Templates", select "Free tier" or an appropriate production template
   - Set DB instance identifier (e.g., "leadertalk-db")
   - Set master username and password
   - Choose appropriate instance size (db.t3.micro for development)

4. **Configure Storage**:
   - Allocate at least 20 GB storage
   - Enable storage autoscaling for production

5. **Configure Connectivity**:
   - Select "Connect to an EC2 compute resource"
   - Choose the EC2 instance created earlier
   - This will automatically set up security groups and network access

6. **Additional Configuration**:
   - Initial database name: "leadertalk"
   - Set backup retention period
   - Enable encryption for production environments

7. **Create Database**:
   - Review settings and click "Create database"

8. **Note Connection Details**:
   - After the database is created, note the endpoint, port, username, and database name

## Step 3: Set Up S3 Bucket for Audio Storage

1. **Navigate to S3 Console**:
   - In AWS Console, go to "Services" → "S3"

2. **Create a New Bucket**:
   - Click "Create bucket"
   - Enter a unique bucket name (e.g., "leadertalk-audio-files")
   - Select the same region as your EC2 instance
   - Configure appropriate access settings (block public access recommended)
   - Enable encryption
   - Click "Create bucket"

3. **Create IAM Role for EC2 to Access S3**:
   - Go to "Services" → "IAM" → "Roles"
   - Click "Create role"
   - Select "AWS service" as the trusted entity and "EC2" as the service
   - Attach the "AmazonS3FullAccess" policy (or create a custom policy with restricted permissions)
   - Name the role (e.g., "EC2-S3-Access") and create it

4. **Attach IAM Role to EC2 Instance**:
   - Go to EC2 dashboard
   - Select your instance
   - Click "Actions" → "Security" → "Modify IAM role"
   - Select the role created in the previous step
   - Click "Update IAM role"

## Step 4: Configure the EC2 Instance

1. **Connect to Your EC2 Instance**:
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@your-instance-public-dns
   ```
   Note: Use `ec2-user` for Amazon Linux or `ubuntu` for Ubuntu AMIs

2. **Update the System**:
   For Amazon Linux:
   ```bash
   sudo yum update -y
   ```
   
   For Ubuntu:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Required Software**:
   For Amazon Linux:
   ```bash
   # Install Node.js
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs gcc-c++ make git
   
   # Install PostgreSQL client
   sudo yum install -y postgresql
   
   # Install Nginx
   sudo amazon-linux-extras install nginx1 -y
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```
   
   For Ubuntu:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL client
   sudo apt install -y postgresql-client
   
   # Install Nginx
   sudo apt install -y nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

4. **Install PM2 for Process Management**:
   ```bash
   sudo npm install -g pm2
   ```

## Step 5: Deploy the Application

1. **Create Application Directory**:
   ```bash
   sudo mkdir -p /var/www/leadertalk
   sudo chown $USER:$USER /var/www/leadertalk
   ```

2. **Clone Repository**:
   ```bash
   cd /var/www/leadertalk
   git clone https://github.com/yourusername/leader-talk.git .
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Create Environment Configuration**:
   Create `.env` file with necessary environment variables:
   ```bash
   cat > .env << EOL
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
   
   # AWS S3
   AWS_S3_BUCKET=leadertalk-audio-files
   AWS_REGION=your-aws-region

   # Server
   PORT=5000
   NODE_ENV=production
   EOL
   ```

5. **Build the Application**:
   ```bash
   npm run build
   ```

6. **Initialize Database**:
   ```bash
   npm run db:push
   ```

7. **Configure PM2**:
   Create an ecosystem file:
   ```bash
   cat > ecosystem.config.js << EOL
   module.exports = {
     apps: [{
       name: "leadertalk",
       script: "server/index.js",
       instances: "max",
       exec_mode: "cluster",
       env: {
         NODE_ENV: "production",
       },
       max_memory_restart: "500M"
     }]
   }
   EOL
   ```

8. **Start the Application with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```

9. **Configure PM2 to Start on Boot**:
   ```bash
   pm2 startup
   # Run the command that PM2 outputs
   pm2 save
   ```

## Step 6: Configure Nginx as Reverse Proxy

1. **Create Nginx Configuration File**:
   ```bash
   sudo nano /etc/nginx/conf.d/leadertalk.conf
   ```

2. **Add Reverse Proxy Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
   
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   
       # For handling large file uploads (like audio recordings)
       client_max_body_size 50M;
   }
   ```

3. **Test and Reload Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Step 7: Set Up SSL with Let's Encrypt

1. **Install Certbot**:
   For Amazon Linux:
   ```bash
   sudo amazon-linux-extras install epel -y
   sudo yum install -y certbot python3-certbot-nginx
   ```
   
   For Ubuntu:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate**:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Configure Automatic Renewal**:
   ```bash
   echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
   ```

## Step 8: Configure DNS

1. **Go to Your Domain Registrar or Route 53**:
   - Create an A record pointing to your EC2 instance's public IP
   - If using Route 53:
     - Create a new record set
     - Name: your-domain.com
     - Type: A - IPv4 address
     - Value: Your EC2 instance's public IP
     - TTL: 300

2. **For Production, Use an Elastic IP**:
   - Go to EC2 console → "Elastic IPs"
   - Allocate new address
   - Associate it with your instance
   - Update your DNS records to point to this elastic IP

## Step 9: Setup Firebase Configuration

1. **Update Firebase Authorized Domains**:
   - Go to the Firebase console
   - Navigate to Authentication → Settings → Authorized domains
   - Add your production domain to the list

## Step 10: Monitoring and Maintenance

1. **Set Up CloudWatch for EC2 Monitoring**:
   ```bash
   sudo amazon-linux-extras install -y collectd
   sudo amazon-linux-extras install -y aws-cloudwatch-agent
   ```
   
   Then configure CloudWatch Agent:
   ```bash
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
   ```

2. **Configure Log Rotation**:
   ```bash
   sudo nano /etc/logrotate.d/leadertalk
   ```
   
   Add the following:
   ```
   /var/www/leadertalk/logs/*.log {
       daily
       missingok
       rotate 14
       compress
       delaycompress
       notifempty
       create 0640 ec2-user ec2-user
       sharedscripts
       postrotate
           pm2 reload all
       endscript
   }
   ```

3. **Set Up Backup Scripts**:
   Create a backup script for the application:
   ```bash
   sudo nano /usr/local/bin/backup-leadertalk.sh
   ```
   
   Add:
   ```bash
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
   BACKUP_DIR="/backup/leadertalk"
   GITHUB_REPO="https://github.com/yourusername/leader-talk.git"
   
   # Create backup directory if it doesn't exist
   mkdir -p $BACKUP_DIR
   
   # Backup environment variables
   cp /var/www/leadertalk/.env $BACKUP_DIR/.env.$TIMESTAMP
   
   # Backup PostgreSQL database
   pg_dump -h your-rds-endpoint -U your-master-username -d leadertalk -f $BACKUP_DIR/leadertalk-db.$TIMESTAMP.sql
   
   # Compress backup
   tar -czf $BACKUP_DIR/leadertalk-backup-$TIMESTAMP.tar.gz $BACKUP_DIR/.env.$TIMESTAMP $BACKUP_DIR/leadertalk-db.$TIMESTAMP.sql
   
   # Upload to S3
   aws s3 cp $BACKUP_DIR/leadertalk-backup-$TIMESTAMP.tar.gz s3://leadertalk-backups/
   
   # Clean up old backups (keep last 7 days)
   find $BACKUP_DIR -name "leadertalk-backup-*.tar.gz" -type f -mtime +7 -delete
   ```
   
   Make it executable:
   ```bash
   sudo chmod +x /usr/local/bin/backup-leadertalk.sh
   ```
   
   Add to crontab:
   ```bash
   echo "0 2 * * * root /usr/local/bin/backup-leadertalk.sh" | sudo tee -a /etc/crontab > /dev/null
   ```

## Step 11: Deployment Scripts

Create a deployment script to simplify future updates:

1. **Create Script**:
   ```bash
   sudo nano /usr/local/bin/deploy-leadertalk.sh
   ```

2. **Add Content**:
   ```bash
   #!/bin/bash
   
   # Go to application directory
   cd /var/www/leadertalk
   
   # Get the latest code
   git pull origin main
   
   # Install dependencies
   npm install
   
   # Build the application
   npm run build
   
   # Apply any database migrations
   npm run db:push
   
   # Restart the application
   pm2 reload all
   
   echo "Deployment completed successfully!"
   ```

3. **Make Executable**:
   ```bash
   sudo chmod +x /usr/local/bin/deploy-leadertalk.sh
   ```

## Step 12: Security Hardening (Optional)

1. **Install and Configure Fail2Ban**:
   ```bash
   sudo yum install -y fail2ban # for Amazon Linux
   # or
   sudo apt install -y fail2ban # for Ubuntu
   
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```
   
   Configure Fail2Ban for SSH protection:
   ```bash
   sudo nano /etc/fail2ban/jail.local
   ```
   
   Add:
   ```
   [sshd]
   enabled = true
   port = ssh
   filter = sshd
   logpath = /var/log/auth.log
   maxretry = 3
   bantime = 3600
   ```

2. **Enable Automatic Security Updates**:
   For Amazon Linux:
   ```bash
   sudo yum install -y yum-cron
   sudo systemctl enable yum-cron
   sudo systemctl start yum-cron
   ```
   
   For Ubuntu:
   ```bash
   sudo apt install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Troubleshooting Common Issues

### 1. Application Won't Start

Check the application logs:
```bash
pm2 logs leadertalk
```

Common issues:
- Environment variables not set correctly
- Database connection problems
- Port conflicts

### 2. Database Connection Errors

Check RDS security group:
- Ensure the security group allows incoming connections from your EC2 instance
- Verify credentials in .env file
- Test connection directly:
  ```bash
  psql -h your-rds-endpoint -U your-master-username -d leadertalk
  ```

### 3. Nginx Configuration Issues

Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

Test configuration:
```bash
sudo nginx -t
```

### 4. SSL Certificate Issues

- Ensure ports 80 and 443 are open in your EC2 security group
- Check Certbot logs:
  ```bash
  sudo tail -f /var/log/letsencrypt/letsencrypt.log
  ```

## Performance Optimization

1. **Enable Nginx Caching**:
   Add to your Nginx configuration:
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=24h max_size=1g;
   
   server {
       # Existing configuration...
       
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           proxy_pass http://localhost:5000;
           proxy_cache STATIC;
           proxy_cache_valid 200 1d;
           proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
           add_header X-Cached $upstream_cache_status;
           expires 1y;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }
   }
   ```

2. **Optimize Node.js Settings**:
   Update your ecosystem.config.js:
   ```javascript
   module.exports = {
     apps: [{
       name: "leadertalk",
       script: "server/index.js",
       instances: "max",
       exec_mode: "cluster",
       env: {
         NODE_ENV: "production",
       },
       max_memory_restart: "500M",
       node_args: "--max-old-space-size=4096"
     }]
   }
   ```

## Scaling Options

### Vertical Scaling
- Upgrade your EC2 instance type for more CPU/RAM
- Modify instance through AWS Console
- Plan for downtime during scaling

### Horizontal Scaling
1. **Create an AMI of your EC2 instance**
2. **Set up a load balancer**:
   - Create an Application Load Balancer
   - Create a target group with your instances
   - Update your DNS to point to the load balancer
3. **Consider using an Auto Scaling Group**:
   - Create launch configuration using your AMI
   - Define scaling policies based on CPU/memory usage

## Cost Optimization

1. **Use Reserved Instances** for predictable workloads
2. **Implement auto-scaling** to reduce costs during low-traffic periods
3. **Monitor and clean up resources**:
   - Unused EBS volumes
   - Unattached Elastic IPs
   - Excess RDS storage

## Maintenance Best Practices

1. **Regular Updates**:
   ```bash
   # Update system
   sudo yum update -y # Amazon Linux
   # or
   sudo apt update && sudo apt upgrade -y # Ubuntu
   
   # Update NPM packages
   cd /var/www/leadertalk
   npm outdated
   npm update
   ```

2. **Regular Backups**:
   - Schedule automated database backups
   - Test restoration process periodically

3. **Monitor Logs and Performance**:
   - Check application logs: `pm2 logs`
   - Check server logs: `sudo journalctl -u nginx`
   - Monitor CPU/Memory: `top` or CloudWatch

## Conclusion

This guide provides a comprehensive approach to deploying the LeaderTalk application directly to an EC2 instance, giving you full control over the server environment. While this approach requires more manual setup compared to Elastic Beanstalk, it offers greater flexibility for customization and optimization.

For production environments, consider implementing additional security measures, monitoring solutions, and scaling strategies based on your specific requirements and user load. Regularly review and update your deployment process to incorporate best practices and new AWS features as they become available.