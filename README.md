# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/de26b341-3d7f-471d-8094-14d9b16c5f83

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/de26b341-3d7f-471d-8094-14d9b16c5f83) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Axios (for API communication)
- Zustand (for state management)
- React Router (for routing)

## Backend Integration

This application integrates with a Django REST API backend. The backend must be running on `http://127.0.0.1:8000` for the application to function properly.

### API Configuration

The API integration is handled using **Axios** in `src/services/api.ts`. This file provides:

- **Base URL Configuration**: All API requests are sent to `http://127.0.0.1:8000/api`
- **Request Interceptor**: Automatically attaches the JWT access token to all requests
- **Response Interceptor**: Handles token refresh on 401 errors and automatic retry
- **Typed API Methods**: Organized by feature (auth, budgets, transactions, etc.)

### Available API Endpoints

#### Authentication (`authApi`)
- `login(username, password)` - User login
- `signup(data)` - User registration
- `changePassword(data)` - Change user password
- `resetPassword(email)` - Request password reset
- `resetPasswordConfirm(uidb64, token, data)` - Confirm password reset

#### Budgets (`budgetApi`)
- `getBudgets()` - Fetch all budgets
- `createBudget(data)` - Create a new budget

#### Transactions (`transactionApi`)
- `createTransaction(data)` - Create a new transaction

#### Payments (`paymentApi`)
- `makePayment()` - Process a payment

#### Categories (`categoriesApi`)
- `getCategories()` - Fetch all categories

### Authentication Flow

1. **Login**: User provides username/password → receives `access` and `refresh` tokens
2. **Token Storage**: Tokens are stored in `localStorage`
3. **Authenticated Requests**: Access token is automatically attached to all API requests
4. **Token Refresh**: When access token expires (401 error), the refresh token is used to obtain a new access token
5. **Logout**: Tokens are removed from `localStorage` and user is redirected to login

### Using the API Service

Import and use the API methods in your components:

```typescript
import { authApi, budgetApi } from '@/services/api';

// Login example
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await authApi.login(username, password);
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Create budget example
const createBudget = async (budgetData) => {
  try {
    const response = await budgetApi.createBudget(budgetData);
    return response.data;
  } catch (error) {
    console.error('Failed to create budget:', error);
  }
};
```

### Running the Backend

Make sure the Django backend is running before starting the frontend:

```sh
# In your backend directory
python manage.py runserver
```

The backend should be accessible at `http://127.0.0.1:8000`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/de26b341-3d7f-471d-8094-14d9b16c5f83) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
