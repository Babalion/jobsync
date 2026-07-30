# JobSync - Job Search Assistant

## <a href="https://demo.jobsync.ca">Live Demo</a>

JobSync is a web app companion for managing your job search journey. This free and open-source project is designed to help job seekers efficiently track and organize their job applications. Say goodbye to the chaos of scattered information and hello to a streamlined, intuitive, and powerful job search experience running locally on your system.

Job searching can be overwhelming, with numerous applications to track and deadlines to meet. JobSync simplifies this process so you can focus on the big picture while keeping your applications organized and up to date.

### Dashboard

![App Snapshot](./screenshots/jobsync-dashboard-screenshot.png?raw=true "App Snapshot Image")

### Jobs Applied list

![App Snapshot](./screenshots/jobsync-myjobs.png?raw=true "My Jobs Page Snapshot Image")

## Key Features
- **Application Tracker:** Keep a detailed record of all your job applications, including company details, job titles, application dates, and current status.
- **Application Dashboard:** Visualize your job search progress with an interactive dashboard showing applications and recent activity.
- **Automated Job Capture:** Use the browser extension to capture job postings from any website with one click. Automatically extracts job details and prevents duplicates. See [docs/AUTOMATED_CAPTURE.md](docs/AUTOMATED_CAPTURE.md) for details.


## Free to Use and Self-Hosted
JobSync Assistant is completely free to use and open source. It provides a powerful job search management tool at no cost and ensures that everyone has access to the resources they need. Additionally, JobSeeker Assistant is designed to be self-hosted, giving you full control over your data. By using Docker, you can easily set up and run JobSync Assistant on your own server, ensuring a secure and personalized experience.


## Installation

### Using Docker

#### Step 1 - Clone repo
* **Alternativey you can also download the source code using download link**

```sh
git clone https://github.com/Gsync/jobsync.git
```

#### Step 2 - Change environment variables
* ** You must create a .env file before proceeding. Refer to .env.example and create or change to .env with your environment variables**
  
#### 2.1 Generate auth secret (Optional) 

These methods will generate a random string that you can use as your AUTH_SECRET. Make sure to set this in your environment variables:

For example, add it to your .env local file:

```sh
AUTH_SECRET="your_generated_secret"
```

##### For npm

```sh
    npm exec auth secret
```
OR
```sh
    npx auth secret
```

##### Using the openssl command available on Linux and Mac OS X:

```sh
    openssl rand -base64 33
```

#### 2.2 Change username and password (Optional) 

You can use default username (admin@example) and password (password123) or change it in you .env file

#### Step 3 - Build docker image and run container
* **Please make sure you have <a href="https://www.docker.com">docker</a> installed and running**
* Please make sure you are in you project directory in your terminal

```sh
docker compose up
```

#### Step 4 - Access the app
* **Open [http://localhost:3000](http://localhost:3000) with your browser to access the app.**
* If you encounter port conflicts, please change it in the docker file

### Credits

- <a href="https://github.com/facebook/react">React</a>
- <a href="https://github.com/vercel/next.js">Next</a>
- <a href="https://github.com/shadcn-ui/ui">Shadcn</a>
- <a href="https://github.com/prisma/prisma">Prisma</a>
- <a href="https://github.com/tailwindlabs/tailwindcss">Tailwind</a>
- <a href="https://github.com/ueberdosis/tiptap">Tiptap</a>
- <a href="https://github.com/plouc/nivo">Nivo</a>
- <a href="https://github.com/sqlite/sqlite">Sqlite</a>
### Note

- If you are updating from an old version and already logged in, please try logging out and login again.
