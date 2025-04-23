# Green IEX Trading Platform

A modern renewable energy trading platform inspired by IEX, specialized for solar, wind, and hydro energy trading along with REC auctions and carbon credit management.

## Features

- User authentication and personalized order history
- Real-time renewable energy trading with order matching
- Advanced price charts with historical data and volume indicators
- Market analysis tools for price trends and market depth
- Mobile-responsive design for all devices
- Order cancellation functionality
- Transaction history with filtering and sorting
- REC (Renewable Energy Certificate) auctions

## Tech Stack

- Frontend: React.js with TypeScript
- UI Framework: Tailwind CSS
- Data Visualization: Recharts
- Real-time Updates: Mock WebSocket Service (ready for Socket.IO)
- State Management: React Hooks and Context API

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── features/        # Feature-specific components
├── hooks/          # Custom React hooks
├── services/       # API and WebSocket services
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

## License

MIT
