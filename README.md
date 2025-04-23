# 🐣 NestJS Lightweight Starter

A minimal and opinionated NestJS starter with built-in development tools, clean project structure, and ready-to-use authentication.

## ✨ Features

- ✅ Lightweight & clean setup
- 🎯 ESLint for linting
- 🎨 Prettier for formatting
- 🔐 Basic JWT authentication
- 🗂️ Predefined modular structure
- 🚀 Fast setup for new projects

## 📦 Tech Stack

- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [JWT](https://jwt.io/)

## 🧱 Project Structure

```bash
src/
├── decorators/        # Shared decorators
├── dto/               # Shared DTOs
├── entities/          # Application entities like users
├── migrations/        # Migration files
├── modules/           # All application modules
    ├── users/         # User module
    ├── .../           # Other modules
├── app.module.ts      # Root module
└── main.ts            # Application bootstrap
```

🚀 Getting Started

Prerequisites
	•	Node.js (>= 22.x)
	•	npm or yarn

Installation

# clone the repo
git clone https://github.com/Lokut192/nestjs-starter
cd nestjs-starter

# install dependencies
npm install
# or
yarn install

Run the app

# development
npm run start:dev

# production
npm run build
npm run start:prod

⚙️ Environment Variables

Create a .env file in the root using template .env.example.

# linting
npm run lint

# formatting
npm run format

📄 License

This project is licensed under a custom license.
Please refer to the LICENSE file for more details.
