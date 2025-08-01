from flask import Flask, render_template, request
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Sample reference texts (for testing purposes)
reference_texts = [
    "Technology has become an integral part of modern society. It affects almost every aspect of daily life, from the way we communicate to how we work and entertain ourselves.",
    "The rapid advancements in technology over the past few decades have revolutionized industries, creating new opportunities and challenges.",
    "While technology has improved the quality of life for many, it also raises important ethical questions that must be addressed to ensure its responsible use."
]

def check_plagiarism(text):
    # Combine the reference texts and the user input for comparison
    texts_to_compare = reference_texts + [text]
    
    # Convert the texts to a matrix of token counts
    vectorizer = CountVectorizer().fit_transform(texts_to_compare)
    
    # Calculate the cosine similarity between the input text and the reference texts
    cosine_similarities = cosine_similarity(vectorizer[-1], vectorizer[:-1])
    
    # If the maximum similarity is above a threshold, consider it plagiarized
    similarity_score = cosine_similarities.max()
    return similarity_score > 0.3  # You can adjust this threshold based on your needs

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        text = request.form['text']
        # Use the updated plagiarism check logic
        is_plagiarized = check_plagiarism(text)
        results = ["Plagiarism detected: Yes" if is_plagiarized else "Plagiarism detected: No"]
        return render_template('index.html', results=results)
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
