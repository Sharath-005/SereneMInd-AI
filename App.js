const { useState, useEffect, useRef } = React;

// --- Database of Supportive Content ---
const supportiveContent = {
    sadness: { tips: ["It's okay to feel sad. Allow yourself to feel it without judgment. Maybe listen to some calming music?", "Remember a time you felt happy. What were you doing? Sometimes recalling positive memories can bring a little light.", "Try the 5-4-3-2-1 grounding technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.", "Consider writing down your feelings. Journaling can be a powerful way to process emotions."] },
    anxiety: { tips: ["Focus on your breath. Inhale slowly for 4 counts, hold for 4, and exhale for 6. Repeat this a few times.", "Try a simple grounding technique: Press your feet firmly into the floor. Feel the solid ground beneath you.", "Anxiety is often about the future. Let's bring it back to the present. What is one thing you can see right now? Describe it in detail.", "Hold a piece of ice in your hand. The intense cold can help pull your focus away from anxious thoughts."] },
    anger: { tips: ["It's valid to feel angry. Let's try to channel that energy. Could you try clenching and then releasing your fists slowly?", "Take a step back. If you can, walk away from the situation for a few minutes to cool down.", "Listen to some intense music and let it absorb the angry energy, or try some calming sounds to soothe it."] },
    joy: { tips: ["That's wonderful to hear! It's great to embrace moments of joy. Take a moment to truly savor this feeling.", "Share your joy! Sometimes telling a friend or loved one can amplify the happiness."] },
    default: { tips: ["Remember to be kind to yourself today.", "Taking a few deep breaths can make a big difference.", "It's okay to not be okay. Your feelings are valid."] }
};

// --- Main Application Component ---
function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [moodHistory, setMoodHistory] = useState([]);
    const [showMoodTracker, setShowMoodTracker] = useState(false);
    const [userName, setUserName] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const chatEndRef = useRef(null);

    // API configurations
    const HUGGING_FACE_API_TOKEN = ""; // Optional: for other models
    const EMOTION_MODEL_URL = "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base";
    
    // IMPORTANT: Replace this with your own key for the saved version to work!
    const GEMINI_API_KEY = ""; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    // Effect to load data from localStorage on initial render
    useEffect(() => {
        const savedName = localStorage.getItem('sereneMindUserName');
        const savedMessages = localStorage.getItem('sereneMindChatHistory');
        const savedMoods = localStorage.getItem('sereneMindMoodHistory');

        if (savedName) {
            setUserName(savedName);
        }

        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
             setMessages([{ 
                text: `Hello${savedName ? ', ' + savedName : ''}! I'm SereneMind AI, your personal mental wellness companion. How are you doing today? ☀️`, 
                sender: 'bot' 
            }]);
        }
        
        if (savedMoods) {
            // Convert string timestamps back to Date objects
            const parsedMoods = JSON.parse(savedMoods).map(mood => ({...mood, timestamp: new Date(mood.timestamp)}));
            setMoodHistory(parsedMoods);
        }
    }, []);

    // Effect to save data to localStorage whenever it changes
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('sereneMindChatHistory', JSON.stringify(messages));
        }
        if (moodHistory.length > 0) {
            localStorage.setItem('sereneMindMoodHistory', JSON.stringify(moodHistory));
        }
    }, [messages, moodHistory]);


    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const detectSevereDistress = (text) => {
        const distressKeywords = ['kill myself', 'suicide', 'end my life', 'can\'t go on', 'no reason to live', 'want to die', 'hurt myself'];
        const lowerText = text.toLowerCase();
        return distressKeywords.some(keyword => lowerText.includes(keyword));
    };

    const handleSend = async () => {
        if (input.trim() === '' || !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") return;

        const userMessageText = input;
        const newMessages = [...messages, { text: userMessageText, sender: 'user' }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        if (detectSevereDistress(userMessageText)) {
            const distressResponse = {
                sender: 'bot', isDistress: true,
                text: "It sounds like you are in severe distress. Please know that there is help available and you are not alone. It's important to talk to someone who can support you right now. Please reach out to one of these 24/7 helplines:",
                helplines: [
                    { name: "Vandrevala Foundation", phone: "9999666555", info: "24/7 helpline in India" },
                    { name: "iCALL", phone: "9152987821", info: "Mon-Sat, 10 AM-8 PM" },
                    { name: "AASRA", phone: "9820466726", info: "24/7 helpline" }
                ]
            };
            setMessages(prev => [...prev, distressResponse]);
            setIsTyping(false);
            return;
        }

        try {
            const emotionResponse = await fetch(EMOTION_MODEL_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: userMessageText })
            });
            
            let detectedEmotion = 'neutral';
            if (emotionResponse.ok) {
                const result = await emotionResponse.json();
                const topEmotion = result[0].reduce((prev, current) => (prev.score > current.score) ? prev : current);
                detectedEmotion = topEmotion.label;
                const newMoodEntry = { emotion: topEmotion.label, score: topEmotion.score, timestamp: new Date() };
                setMoodHistory(prev => [...prev, newMoodEntry]);
            }

            await generateConversationalResponse(newMessages, detectedEmotion);

        } catch (error) {
            console.error("Error in processing message:", error);
            const errorMessage = { text: "I'm having a little trouble connecting right now. Let's try that again in a moment. 🙏", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const generateConversationalResponse = async (chatHistory, emotion) => {
        const lastMessages = chatHistory.slice(-5);
        const conversationContext = lastMessages.map(msg => `${msg.sender === 'user' ? (userName || 'User') : 'AI'}: ${msg.text}`).join('\n');
        const userInput = lastMessages[lastMessages.length - 1].text;
        const emotionKey = supportiveContent[emotion] ? emotion : 'default';
        const knowledgeBase = supportiveContent[emotionKey].tips.join(' ');

        const prompt = `You are SereneMind AI, a friendly, empathetic, and intelligent mental health chatbot. The user's name is ${userName || 'not set'}. Here is the recent conversation history:\n${conversationContext}\n\nThe user's latest message is: "${userInput}". Their primary emotion seems to be '${emotion}'.\n\nBased on the conversation history and the user's last message, provide a supportive, caring, and directly relevant response. If you know the user's name, use it to make the conversation more personal. Acknowledge what the user said. Do NOT repeat previous answers. You can reference these self-care ideas if they are relevant: "${knowledgeBase}".\n\nImportant Rules:\n- Do NOT give clinical diagnoses or act as a therapist.\n- Keep your response concise, empathetic, and helpful.\n- Use emojis to make the tone more friendly.`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Gemini API request failed with status ${response.status}`);
            
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0) {
                const botResponseText = result.candidates[0].content.parts[0].text;
                const botMessage = { text: botResponseText, sender: 'bot' };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error("No response candidate from Gemini.");
            }
        } catch (error) {
            console.error("Error generating conversational response:", error);
            const fallbackMessage = { text: "I'm here to listen. Could you tell me a little more about what's on your mind? 🤔", sender: 'bot' };
            setMessages(prev => [...prev, fallbackMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSaveSettings = (newName) => {
        setUserName(newName);
        localStorage.setItem('sereneMindUserName', newName);
        setShowSettings(false);
    };
    
    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
            {showSettings && <SettingsModal onSave={handleSaveSettings} onClose={() => setShowSettings(false)} currentName={userName} />}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm p-4 flex justify-between items-center z-10 border-b border-gray-200">
                <div className="flex items-center">
                    <svg className="w-8 h-8 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-xl font-bold text-gray-800">SereneMind AI</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold p-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-sm"
                        title="Settings"
                    >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </button>
                    <button 
                        onClick={() => setShowMoodTracker(!showMoodTracker)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex items-center"
                    >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        {showMoodTracker ? 'Close Tracker' : 'Mood Tracker'}
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className={`flex-1 flex flex-col p-2 sm:p-4 transition-all duration-500 ${showMoodTracker ? 'w-full md:w-1/2' : 'w-full'}`}>
                    <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden flex flex-col">
                        <div className="chat-container flex-1 p-6 space-y-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <Message key={index} msg={msg} />
                            ))}
                            {isTyping && <TypingIndicator />}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className="p-4 bg-gray-50/80 border-t border-gray-200">
                            <div className="flex items-center bg-white rounded-full shadow-inner">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" ? "Type your message here..." : "Please add your API key in the code"}
                                    className="w-full p-3 pl-5 bg-transparent rounded-full focus:outline-none text-gray-700"
                                    disabled={isTyping || !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE"}
                                />
                                <button onClick={handleSend} disabled={isTyping || !input.trim() || !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE"} className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 m-1 rounded-full transition-all duration-300 transform hover:scale-110 disabled:bg-indigo-300 disabled:scale-100">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-3 p-2">
                        <strong>Disclaimer:</strong> I am an AI companion, not a substitute for professional medical advice.
                    </div>
                </div>

                {showMoodTracker && (
                    <div className="w-full md:w-1/2 p-2 sm:p-4 fade-in">
                        <MoodTracker history={moodHistory} />
                    </div>
                )}
            </main>
        </div>
    );
}

const SettingsModal = ({ onSave, onClose, currentName }) => {
    const [name, setName] = useState(currentName);

    const handleSave = () => {
        onSave(name);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm transform transition-all">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-gray-600 block mb-2">Your Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="How should I call you?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const Message = ({ msg }) => {
    const isUser = msg.sender === 'user';
    
    if (msg.isDistress) {
        return (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-r-lg shadow-md fade-in-slide-up">
                <p className="font-bold">Important Message</p>
                <p className="mt-1">{msg.text}</p>
                <ul className="mt-3 list-disc list-inside space-y-2 text-sm">
                    {msg.helplines.map(line => (
                        <li key={line.name}>
                            <strong>{line.name}:</strong> <a href={`tel:${line.phone}`} className="underline hover:text-red-600">{line.phone}</a> <span className="text-gray-600">({line.info})</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} fade-in-slide-up`}>
            <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-md ${isUser ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
        </div>
    );
};

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 fade-in-slide-up">
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const MoodTracker = ({ history }) => {
    const plotRef = useRef(null);

    useEffect(() => {
        if (history.length > 0) {
            const emotionColors = { sadness: '#3B82F6', joy: '#FBBF24', love: '#F472B6', anger: '#EF4444', fear: '#A855F7', surprise: '#22C55E', anxiety: '#A855F7', neutral: '#6B7280' };

            const data = {
                x: history.map(h => h.timestamp), y: history.map(h => h.emotion),
                mode: 'markers', type: 'scatter',
                marker: {
                    size: history.map(h => h.score * 20 + 8),
                    color: history.map(h => emotionColors[h.emotion] || '#6B7280'),
                    opacity: 0.8,
                    line: { color: 'white', width: 1 }
                },
                text: history.map(h => `${h.emotion} (Score: ${h.score.toFixed(2)})`),
                hoverinfo: 'text+x'
            };

            const layout = {
                title: 'Your Weekly Mental Wellness Snapshot',
                xaxis: { title: 'Date & Time', gridcolor: '#e5e7eb' },
                yaxis: { title: 'Detected Emotion', gridcolor: '#e5e7eb' },
                margin: { t: 50, b: 80, l: 80, r: 40 },
                paper_bgcolor: 'rgba(255,255,255,0.8)',
                plot_bgcolor: 'rgba(255,255,255,0.8)',
                font: { family: 'Inter, sans-serif', color: '#1f2937' }
            };

            Plotly.newPlot(plotRef.current, [data], layout, {responsive: true, displaylogo: false});
        }
    }, [history]);

    if (history.length === 0) {
        return (
            <div className="w-full h-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center p-6 text-center">
                <div className="text-gray-600">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                    <h3 className="text-lg font-semibold text-gray-800">Mood Tracker is Ready!</h3>
                    <p className="mt-1">Start chatting, and your mood trends will appear here over time. It's a great way to reflect on your emotional journey. ✨</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-4">
            <div ref={plotRef} className="w-full h-full"></div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
