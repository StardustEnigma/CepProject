# 🚀 Cloud Deployment Planner (AWS + Vercel + MongoDB Atlas)

This is your master checklist and deployment guide to smoothly migrate the Gurukul Academy system to a 24/7 cloud-hosted architecture.

## 📋 The "Tri-Cloud" Stack Overview

* **Frontend:** Vercel (Free) - Fast, serverless CDN for React.
* **Backend:** AWS EC2 (Free Tier) - Persistent Node.js server to run your API.
* **Database:** MongoDB Atlas (Free Tier) - Cloud database to keep data safe across server restarts.

---

## 🛠️ Phase 1: Database Migration (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new "M0 Free" database cluster.
3. In Database Access, create a new Database User (e.g., username `admin`, and save the password).
4. In Network Access, whitelist all IPs (`0.0.0.0/0`) so AWS can connect to it.
5. Click **Connect** on your cluster, select "Drivers", copy your MongoDB Connection String (replacing `<password>` with your real password).
6. In your `server` directory, create a `.env` file and paste it:
   ```env
   MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.mongodb.net/gurukul?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key
   PORT=5000
   ```
*(Note: We will update your code to use Mongoose to hook into this!)*

---

## 🌐 Phase 2: Deploying Frontend to Vercel

Vercel makes deploying the React app from a monorepo effortless.

1. Push your entire repository to GitHub.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. **CRITICAL STEP:** In the project settings window before you click Deploy, expand **"Root Directory"** and click **Edit**. Select the `client` folder.
5. Vercel will now deploy only the frontend! (You'll come back later to update a Vercel Environment Variable that points to your AWS API link).

---

## 🧠 Phase 3: Deploying Backend to AWS EC2

1. Log into AWS Console and launch a new **EC2 Instance** (Ubuntu, t2.micro or t3.micro Free Tier).
2. Configure the Security Group to open port `5000` (Custom TCP) and port `22` (SSH).
3. Connect to your EC2 instance via SSH and run these setup commands:
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   # Reload terminal session here if needed
   nvm install 20
   npm install -g pm2
   ```
4. Clone your repository onto the EC2 instance:
   ```bash
   git clone YOUR_GITHUB_REPO_URL
   cd YOUR_REPO_NAME/server
   ```
5. Create your `.env` file on AWS using `nano .env` and paste your MongoDB URI and JWT Secret.
6. Install backend dependencies and start it:
   ```bash
   npm install
   pm2 start server.js --name "gurukul-backend"
   pm2 save
   ```

## 🔗 Phase 4: Linking them Together

Now that AWS is running your backend, it will have a Public IP (e.g., `http://54.123.45.67:5000`).

1. Go back to Vercel Dashboard -> Your Project -> Settings -> Environment Variables.
2. Add a new variable: `REACT_APP_API_URL` set to your AWS Public IP (e.g. `http://54.123.45.67:5000`).
3. Redeploy your frontend on Vercel so it picks up the new backend address.

**You are now fully cloud-hosted! 🚀**
