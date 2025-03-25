# VoiceHub

VoiceHub is a modern web application that combines powerful text-to-speech and audio recording capabilities in one intuitive interface. Built with React and TypeScript, it offers a comprehensive solution for audio content creation and management.

## Key Features

### Text-to-Speech

- Multiple language support with AI-powered text optimization
- Adjustable speech speed control
- Audio history management
- Real-time audio playback

### Audio Recording

- High-quality audio recording capabilities
- Drag-and-drop file upload support
- Support for multiple audio formats
- Comprehensive recording history

## Technical Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand
- **UI Components**: HeroIcons and Lucide React
- **Notifications**: React Hot Toast
- **File Handling**: JSZip and FileSaver
- **Build Tool**: Vite

## Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd voicehub
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your environment variables.

## Development

Start the development server:

```bash
npm run dev
```

## Building for Production

Build the project:

```bash
npm run build
```

## Project Structure

```
src/
├── api/          # API integration
├── components/   # React components
├── hooks/        # Custom React hooks
├── libs/         # Utility libraries
├── services/     # Application services
└── store/        # State management
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
