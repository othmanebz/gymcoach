# Virtual Gym Coach 🏋️‍♂️

A web-based AI-powered fitness companion that provides personalized workout and nutrition advice based on your profile.

## Features

- **Personalized Profile Management**
  - Input and store personal metrics (age, weight, height, sex)
  - Automatic BMI calculation
  - Daily calorie needs estimation

- **AI-Powered Fitness Coach**
  - Real-time chat interface with AI coach
  - Personalized workout recommendations
  - Diet and nutrition advice
  - Context-aware responses based on user profile

- **Voice Input Support**
  - Voice-to-text functionality for queries
  - Real-time speech recognition
  - Visual recording indicators

- **Modern User Interface**
  - Responsive design for all devices
  - Clean, intuitive layout
  - Real-time chat animations
  - Loading indicators and toast notifications

## Technical Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome for icons
- CSS Grid and Flexbox for layouts
- Web Speech API for voice recognition

### Backend
- Flask (Python)
- Google Generative AI (Gemini 1.5 Flash)
- Sentence Transformers for embeddings
- Weaviate vector database
- BeautifulSoup4 for web scraping
- Google Custom Search API

## Setup

### Prerequisites
- Python 3.8+
- Node.js and npm (for development)
- Weaviate instance
- Google API credentials

### Environment Variables
Create a `.env` file with the following:
```
SECRET_KEY=your_secret_key
GENAI_API_KEY=your_gemini_api_key
WEAVIATE_URL=your_weaviate_instance_url
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_google_custom_search_id
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/virtual-gym-coach.git
cd virtual-gym-coach
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

4. Open `index.html` in a modern web browser or serve it using a local server.

## Usage

1. Fill out your profile information (sex, age, weight, height)
2. Start chatting with the AI coach using:
   - Text input
   - Voice input (click microphone icon)
3. Ask questions about:
   - Workout routines
   - Nutrition advice
   - Fitness goals
   - Exercise techniques

## Browser Support

- Chrome (recommended for full voice support)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Generative AI for powering the AI coach
- Weaviate for vector search capabilities
- Font Awesome for icons
- All contributors and testers

## Security

- User data is stored locally in the browser
- No sensitive information is transmitted to external services
- API keys should be kept secure and never exposed in frontend code

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
