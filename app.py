from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from weaviate.client import Client
import google.generativeai as genai
from flask_cors import CORS
from dotenv import load_dotenv
import os
from googleapiclient.discovery import build
from bs4 import BeautifulSoup
import requests

load_dotenv()

secret_key = os.getenv("SECRET_KEY")
genai_api_key = os.getenv("GENAI_API_KEY")
weaviate_url = os.getenv("WEAVIATE_URL")
google_api_key = os.getenv("GOOGLE_API_KEY") 
google_cx = os.getenv("GOOGLE_CX")

genai.configure(api_key=genai_api_key)
weaviate_client = Client(weaviate_url)

geminyflash = genai.GenerativeModel("gemini-1.5-flash")

# Schema for Weaviate
schema_definition = {
    "class": "Document",
    "properties": [
        {"name": "text", "dataType": ["text"], "description": "The content of the document"}
    ],
}

if not weaviate_client.schema.contains(schema_definition):
    weaviate_client.schema.create({"classes": [schema_definition]})

# Initialize SentenceTransformer for embedding generation
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

app = Flask(__name__)
CORS(app)

# Generate embeddings
def generate_embedding(text):
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding

def google_search(query, num_results=5):
    try:
        # Initialize the Google Custom Search service
        service = build("customsearch", "v1", developerKey=google_api_key)
        
        # Perform the search
        result = service.cse().list(q=query, cx=google_cx, num=num_results).execute()
        
        search_results = []
        if "items" in result:
            for item in result["items"]:
                # Extract title and link for each search result
                title = item['title']
                link = item['link']
                # Fetch the page content to extract useful information
                page_content = fetch_page_content(link)
                if page_content:
                    search_results.append({
                        "title": title,
                        "content": page_content,
                        "link": link
                    })
        return search_results

    except Exception as e:
        print(f"Google Search Error: {e}")
        return []

# Fetch page content and clean it for relevance
def fetch_page_content(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            paragraphs = soup.find_all('p')
            content = " ".join([p.get_text() for p in paragraphs])
            # Optionally filter or process the content further to focus on the most relevant sections
            return content.strip()[:5000]  # Limit to 1000 chars for brevity
        else:
            return None
    except Exception as e:
        print(f"Error fetching content from {url}: {e}")
        return None

# Route to query documents and generate a response
@app.route('/query', methods=['POST'])
def query():
    try:
        # Get the data from the request
        data = request.get_json()
        query_text = data['query']
        user_profile = data['user_profile']

        # Extract user profile information
        sex = user_profile['sex']
        age = user_profile['age']
        weight = user_profile['weight']
        height = user_profile['height']
        personalized_query = f"Query: {query_text}. User Profile - Sex: {sex}, Age: {age}, Weight: {weight}kg, Height: {height}cm."

        # Generate the query embedding
        query_embedding = generate_embedding(personalized_query)

        # Fetch relevant documents from Weaviate
        results = weaviate_client.query.get("Document", ["text"]).with_near_vector(
            {"vector": query_embedding.tolist()}
        ).with_limit(4).do()

        # Extract the document texts
        documents = [result["text"] for result in results["data"]["Get"]["Document"]]

        # Fetch Google search results with more useful content
        google_results = google_search(query_text, num_results=3)
        google_contexts = [result['content'] for result in google_results if result['content']]
        print(f"\nGoogle Search Results: {google_results}")

        # Combine Weaviate and Google content for generating a response
        combined_context = " ".join(documents + google_contexts)

        # Generate the prompt for Gemini
        gemini_prompt = f"""
You are a professional gym coach specializing in personalized workout routines and diet planning.  
The user's profile is as follows:  

- Sex: {sex}  
- Age: {age}  
- Weight: {weight} kg  
- Height: {height} cm  

**Guidelines:**  
1. Only provide fitness and diet-related advice
2. Politely decline to answer any unrelated questions by stating: "I am here to assist you with fitness and diet planning. Please ask questions specific to these topics."  
3. Provide advice tailored to the user's profile, fitness level, and goals.  
4. Ensure advice is tailored to the user's profile
5. Include specific, actionable recommendations
6. Cite sources when possible

**Context:**  
{combined_context}  

**Query:**  
{query_text}
        """

        # Generate the response using Google Generative AI
        gemini_response = geminyflash.generate_content(gemini_prompt)

        # Get the generated answer
        answer = gemini_response.text.strip()

        return jsonify({"answer": answer, "similar_documents": documents, "google_results": google_results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
