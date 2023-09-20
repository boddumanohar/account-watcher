# Use an official Node.js runtime as the base image
FROM node:20.7.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Install the app's dependencies inside the container
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Set the container to listen on port 3000 at runtime (you can adjust as needed)
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
