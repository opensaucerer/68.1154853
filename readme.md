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

I have structured in code in a loosely-coupled manner to allow for easy scaling with tools like AWS Lambda or GCP Cloud Functions.

## Projections

I apologize that the submission of this project happened toward the end of the 8 hours time frame. I wasn't feeling too well and had to take a break during the process. I do hope you understand. I think I spent just about 4 hours actually working on the project.

I also did not make commits as I went along which ideally isn't the best practice as I was trying to get the project done as quickly as possible.

I also started working on a test suite implementation but couldn't really compound on it. It was really just a thought I had and decided to experiment with it.
