# NFT Event Processor

This is a simple event processor for tracking NFT listings.

## Pre-requisites

- MySQL
- Yarn
- Node.js
- TypeScript

## Installation

1. Clone the repository
2. Run `yarn`
3. Create a `.env` file in the root with the contents of `.env.example`
4. Run `yarn start`

The application is currently configured to run with `nodemon` but should be modified for production use to first go through a build process and then run the built files directly with `node` as `nodemon` is not suitable for production use.

## Scaling

I have structured the code in a loosely-coupled manner to allow for easy scaling with tools like AWS Lambda or GCP Cloud Functions. This means we can modify the entry point, eliminate the custom event scheduler and allow the cloud provider to handle the scheduling of the event processor.

I've also implemented asynchronous processing of non-interfering tasks using NodeJS' event emitters. This allows for easy scaling of the application to handle more tasks without the need for a complex message queue system.

The asynchronous generator function also ensure data from the reservoir are processed in sizes that are manageable and wouldn't cause the application to crash due to memory issues.

Currently, the error handling doesn't focus on specifics as most of the queries are batched to allow for efficient writes but global error handlers have been implemented to ensure the application doesn't crash due to a single error and that stack traces are logged for debugging purposes.

I should also mention that most of the implementations in this project are made from the ground up to simply demonstrate my understanding of the concepts. In a real-world scenario, I wouldn't go such route unless it is absolutely necessary rather I would use a library or framework that has been tested and proven to work.

I also started working on a test suite implementation but couldn't really compound on it. It was really just a thought I had and decided to experiment with it.

## Fun Facts

The repository name `68.1154853` has an easter egg. The number `68.1154853` is the number of Bitcoins present within the Genesis address as of Sep 18, 2019
