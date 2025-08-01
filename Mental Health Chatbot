<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mental Health Chatbot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #f0fdfa; /* Mint Cream */
        }
        .chatbot-container {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transition: all 0.3s ease-in-out;
        }
        .chat-bubble {
            max-width: 75%;
            opacity: 0;
            transform: translateY(10px);
            animation: fadeIn 0.5s forwards;
        }
        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .user-bubble {
            background-color: #14B8A6; /* Teal-500 */
            color: white;
        }
        .bot-bubble {
            background-color: #F0FDF4; /* Teal-50 */
            color: #134E4A; /* Teal-900 */
            border: 1px solid #CCFBF1; /* Teal-100 */
        }
        .input-container {
            border-top: 1px solid #CCFBF1; /* Teal-100 */
        }
        #chat-log::-webkit-scrollbar {
            width: 8px;
        }
        #chat-log::-webkit-scrollbar-track {
            background: #F0FDF4; /* Teal-50 */
        }
        #chat-log::-webkit-scrollbar-thumb {
            background-color: #5EEAD4; /* Teal-300 */
            border-radius: 20px;
        }
        .header-gradient {
            background: linear-gradient(to right, #14B8A6, #0D9488);
        }
    </style>
</head>
<body class="flex items-center justify-center h-screen">

    <div class="chatbot-container w-full max-w-lg h-[90vh] rounded-2xl bg-white flex flex-col">
        <!-- Header -->
        <div class="header-gradient text-white p-4 rounded-t-2xl flex items-center shadow-lg">
             <svg class="w-12 h-12 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <div>
                <h1 class="text-xl font-bold">Mindful Mate</h1>
                <p class="text-sm opacity-90">Your friendly mental health companion</p>
            </div>
        </div>

        <!-- Chat Log -->
        <div id="chat-log" class="flex-1 p-6 overflow-y-auto bg-white">
            <!-- Bot Welcome Message -->
            <div class="flex justify-start mb-4">
                <div class="bot-bubble rounded-xl p-3 chat-bubble" style="animation-delay: 0.2s;">
                    <p class="text-sm">Hello! I'm Mindful Mate. I'm here to listen and offer support. How are you feeling today?</p>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-container p-4 bg-white rounded-b-2xl">
            <div class="flex items-center">
                <input type="text" id="user-input" placeholder="Type your message..." class="flex-1 border-2 border-gray-200 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow">
                <button id="send-btn" class="bg-teal-500 text-white rounded-full p-3 ml-3 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform transform hover:scale-110">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </button>
            </div>
        </div>
    </div>

    <script>
        const chatLog = document.getElementById('chat-log');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const apiKey = "AIzaSyAx-8Badbvv4yQlXJbqaXct-BclO4OD3lA"; // This will be handled by the environment

        // --- Core Chat Logic ---

        function addMessage(message, sender) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('flex', 'mb-4');

            const bubble = document.createElement('div');
            bubble.classList.add('rounded-xl', 'p-3', 'chat-bubble', 'shadow-sm');

            if (sender === 'user') {
                messageElement.classList.add('justify-end');
                bubble.classList.add('user-bubble');
            } else if (sender === 'bot-loading') {
                messageElement.classList.add('justify-start');
                bubble.classList.add('bot-bubble');
                bubble.innerHTML = `<div class="flex items-center justify-center"><div class="w-2 h-2 bg-teal-300 rounded-full animate-pulse mr-1.5"></div><div class="w-2 h-2 bg-teal-300 rounded-full animate-pulse mr-1.5" style="animation-delay: 0.1s;"></div><div class="w-2 h-2 bg-teal-300 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div></div>`;
            } else { // 'bot'
                messageElement.classList.add('justify-start');
                bubble.classList.add('bot-bubble');
                bubble.textContent = message;
            }
            
            if (sender === 'user' || sender === 'bot') {
                 bubble.textContent = message;
            }

            messageElement.appendChild(bubble);
            chatLog.appendChild(messageElement);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
        
        // --- Gemini API Integration ---
        
        async function getBotResponse(prompt) {
            addMessage("...", "bot-loading");

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    role: "user",
                    parts: [{
                        text: `You are a friendly and supportive mental health chatbot named Mindful Mate. Your goal is to provide comfort, gentle guidance, and a safe space for users to express their feelings. Never give medical advice. Keep your responses concise and empathetic. User's message: "${prompt}"`
                    }]
                }]
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                
                chatLog.removeChild(chatLog.lastChild);

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
                    const botMessage = result.candidates[0].content.parts[0].text;
                    addMessage(botMessage, 'bot');
                } else {
                    addMessage("I'm having a little trouble thinking right now. Could you try rephrasing?", 'bot');
                }
            } catch (error) {
                console.error("Error fetching bot response:", error);
                if (chatLog.lastChild) {
                    chatLog.removeChild(chatLog.lastChild);
                }
                addMessage("Sorry, I couldn't connect. Please check your connection and try again.", 'bot');
            }
        }

        // --- Event Listeners ---

        sendBtn.addEventListener('click', () => {
            const userMessage = userInput.value.trim();
            if (userMessage) {
                addMessage(userMessage, 'user');
                getBotResponse(userMessage);
                userInput.value = '';
            }
        });

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    </script>

</body>
</html>
