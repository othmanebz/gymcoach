// Utility functions
function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

function calculateCalories(profile) {
    // Basic BMR calculation using Harris-Benedict equation
    let bmr;
    if (profile.sex === 'Male') {
        bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
        bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    return Math.round(bmr * 1.2); // Multiplied by 1.2 for sedentary activity level
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Auto-resize textarea
const textarea = document.getElementById('userPrompt');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Initialize profile from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    if (profile) {
        displayProfile(profile);
    }

    // Add enter key support for sending messages
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('askButton').click();
        }
    });
});

// Handle profile form submission
document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profile = {
        sex: formData.get('sex'),
        age: parseInt(formData.get('age')),
        weight: parseFloat(formData.get('weight')),
        height: parseFloat(formData.get('height'))
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profile));
    displayProfile(profile);
    showToast('Profile updated successfully!');
});

// Handle profile editing
document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    document.querySelector('.profile-form').style.display = 'block';
    document.querySelector('.profile-info').style.display = 'none';
});

// Display profile info
function displayProfile(profile) {
    // Update form values
    document.getElementById('sex').value = profile.sex;
    document.getElementById('age').value = profile.age;
    document.getElementById('weight').value = profile.weight;
    document.getElementById('height').value = profile.height;

    // Update profile display
    document.querySelector('.profile-form').style.display = 'none';
    document.querySelector('.profile-info').style.display = 'block';
    document.getElementById('profileSex').textContent = profile.sex;
    document.getElementById('profileAge').textContent = `${profile.age} years`;
    document.getElementById('profileWeight').textContent = `${profile.weight} kg`;
    document.getElementById('profileHeight').textContent = `${profile.height} cm`;

    // Update fitness metrics
    document.getElementById('bmiValue').textContent = calculateBMI(profile.weight, profile.height);
    document.getElementById('calorieValue').textContent = `${calculateCalories(profile)} kcal`;
}

// Add message to chat
function addMessage(sender, text) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}`;
    avatar.innerHTML = sender === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // Apply formatting only to coach messages
    if (sender === 'coach') {
        bubble.innerHTML = formatResponse(text);
    } else {
        bubble.textContent = text;
    }

    if (sender === 'user') {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Add loading indicator
function addLoadingIndicator() {
    const chatContainer = document.getElementById('chatContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-bubble coach';
    loadingDiv.id = 'loadingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'avatar coach';
    avatar.innerHTML = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<span></span><span></span><span></span>';
    
    bubble.appendChild(loading);
    loadingDiv.appendChild(avatar);
    loadingDiv.appendChild(bubble);
    
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

function formatResponse(response) {
    // Replace markdown-like syntax with HTML tags
    let formattedText = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/(?:^|\n)- (.*?)(?=\n|$)/g, '<li>$1</li>') // Bullet points
        .replace(/\n/g, '<br>'); // Newlines

    // Wrap bullet points in a single unordered list
    formattedText = formattedText.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');

    // Remove redundant <ul> tags caused by multiple replacements
    formattedText = formattedText.replace(/<\/ul>\s*<ul>/g, '');

    // Ensure clean breaks and trimming
    formattedText = formattedText
        .replace(/<br>\s*<ul>/g, '<ul>') // Remove unnecessary breaks before lists
        .replace(/<\/ul>\s*<br>/g, '</ul>') // Remove unnecessary breaks after lists
        .trim();

    return formattedText;
}

// Handle chat functionality
document.getElementById('askButton').addEventListener('click', async () => {
    const prompt = document.getElementById('userPrompt').value.trim();
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    
    if (!prompt) return;
    if (!profile) {
        showToast('Please complete your profile first!', 'error');
        return;
    }

    // Disable input while processing
    const askButton = document.getElementById('askButton');
    const textarea = document.getElementById('userPrompt');
    askButton.disabled = true;
    textarea.disabled = true;

    addMessage('user', prompt);
    textarea.value = '';
    textarea.style.height = 'auto';
    
    // Add loading indicator
    addLoadingIndicator();

    try {
        const response = await fetch('http://127.0.0.1:5000/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: prompt, 
                user_profile: profile 
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        removeLoadingIndicator();
        addMessage('coach', data.answer);
    } catch (error) {
        removeLoadingIndicator();
        addMessage('coach', "I apologize, but I'm having trouble connecting to the server. Please try again in a moment.");
        showToast('Connection error occurred', 'error');
    } finally {
        askButton.disabled = false;
        textarea.disabled = false;
        textarea.focus();
    }
});

// Clear chat
document.getElementById('clearChat').addEventListener('click', () => {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = '';
    addMessage('coach', "Hello! I'm your virtual gym coach. How can I assist you today?");
});

// Voice input functionality
let recognition = null;
let isRecording = false;

// Initialize speech recognition and UI elements
function initializeVoiceInput() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition not supported');
        showToast('Voice input is not supported in this browser', 'error');
        return;
    }

    // Initialize speech recognition
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Create and add the record button
    const inputActions = document.querySelector('.input-actions');
    const recordButton = document.createElement('button');
    recordButton.className = 'action-btn record-btn';
    recordButton.innerHTML = `
        <i class="fas fa-microphone"></i>
        <span class="recording-status"></span>
    `;
    recordButton.title = 'Record voice input';
    
    // Create status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'recording-indicator';
    statusIndicator.innerHTML = 'Click to start recording';
    inputActions.insertBefore(statusIndicator, inputActions.firstChild);
    
    // Insert the record button before the send button
    const sendButton = document.getElementById('askButton');
    inputActions.insertBefore(recordButton, sendButton);

    // Handle recording state UI
    function updateRecordingState(recording) {
        isRecording = recording;
        recordButton.innerHTML = recording ? 
            `<i class="fas fa-microphone-slash"></i>
             <span class="recording-status active"></span>` : 
            `<i class="fas fa-microphone"></i>
             <span class="recording-status"></span>`;
        recordButton.classList.toggle('recording', recording);
        statusIndicator.innerHTML = recording ? 
            '<span class="listening">Listening...</span>' : 
            'Click to start recording';
        
        if (recording) {
            showToast('Recording started - Speak now', 'recording');
        } else {
            showToast('Recording stopped', 'info');
        }
    }

    // Handle voice recording
    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            recognition.start();
            updateRecordingState(true);
        } else {
            recognition.stop();
            updateRecordingState(false);
        }
    });

    // Handle speech recognition results
    recognition.onresult = (event) => {
        const textarea = document.getElementById('userPrompt');
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
            
        textarea.value = transcript;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        
        statusIndicator.innerHTML = '<span class="listening">Listening: ' + transcript + '</span>';
    };

    // Handle speech recognition end
    recognition.onend = () => {
        updateRecordingState(false);
    };

    // Handle speech recognition errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        updateRecordingState(false);
        showToast('Error recording voice. Please try again.', 'error');
        statusIndicator.innerHTML = 'Error: Please try again';
    };
}

// Initialize voice input when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoiceInput);
} else {
    initializeVoiceInput();
}