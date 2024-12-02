# AInvestGenie
## This project was developed by a team of 6 interns working at Intertech during the 2024 Summer Internship Programme.

## Overview

AInvestGenie is an application designed to help users interact with financial data and gain insights powered by AI. The project consists of a client-side application built with React Native and a server-side application using Express.js and MongoDB.

## Installation

### Server

1. Navigate to the `server` directory:
    ```sh
    cd server
    ```
2. Install the dependencies:
    ```sh
    npm install
    ```
3. Create a `.env` file in the `server` directory and add the necessary environment variables:
    ```env
    MONGODB_URI=<your_mongodb_uri>
    AZURE_OAI_ENDPOINT=<your_azure_oai_endpoint>
    AZURE_OAI_KEY=<your_azure_oai_key>
    AZURE_OAI_DEPLOYMENT=<your_azure_oai_deployment>
    SystemPrompt=<your_system_prompt>
    PORT=<your_port>
    ```

### Client

1. Navigate to the `client` directory:
    ```sh
    cd client
    ```
2. Install the dependencies:
    ```sh
    npm install
    ```

## Running the Application

### Server

To start the server, run the following command in the `server` directory:
```sh
npm run devstart
```

### Client

To start the client application, run the following command in the `client` directory:
```sh
npm run android
```
